import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Parse the minimum numeric value from a price range string like "$40–$120" or "$99"
function parseMinPrice(range) {
  if (!range) return null;
  const nums = range.replace(/[^\d.]/g, ' ').trim().split(/\s+/).map(Number).filter(n => n > 0);
  return nums.length > 0 ? Math.min(...nums) : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // If called directly by a user (not via scheduled automation), require admin
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    // Fetch all saved products and all institution circles
    const [savedProducts, circles] = await Promise.all([
      base44.asServiceRole.entities.SavedProduct.list(),
      base44.asServiceRole.entities.Circle.filter({ category: 'institution' }),
    ]);

    if (savedProducts.length === 0) {
      return Response.json({ message: 'No saved products to check.' });
    }

    // For each unique circle with saved products, fetch current product data via AI
    const circleIds = [...new Set(savedProducts.map(s => s.circle_id))];
    const circleMap = {};
    for (const c of circles) circleMap[c.id] = c;

    // Build a map of circle_id -> fresh product prices by fetching website info
    const freshPriceMap = {}; // key: `${circle_id}__${product_category}` -> min price

    for (const circleId of circleIds) {
      const circle = circleMap[circleId];
      if (!circle?.website_url) continue;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Visit ${circle.website_url} and extract the current price ranges for their main product categories. Return ONLY the JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  price_range: { type: 'string', description: 'e.g. $40–$120' },
                },
              },
            },
          },
        },
      }).catch(() => null);

      if (!result?.products) continue;

      for (const p of result.products) {
        const key = `${circleId}__${p.category}`;
        freshPriceMap[key] = parseMinPrice(p.price_range);
      }
    }

    const alerts = [];

    for (const saved of savedProducts) {
      const key = `${saved.circle_id}__${saved.product_category}`;
      const freshMin = freshPriceMap[key];
      const savedMin = saved.last_known_price_min;

      // Only alert if we have both prices and fresh price is lower
      if (freshMin == null || savedMin == null) continue;
      if (freshMin >= savedMin) continue;

      const drop = savedMin - freshMin;
      const dropPct = Math.round((drop / savedMin) * 100);

      alerts.push({
        saved,
        freshMin,
        savedMin,
        drop,
        dropPct,
        circle: circleMap[saved.circle_id],
      });

      // Update the saved record with the new price
      await base44.asServiceRole.entities.SavedProduct.update(saved.id, {
        last_known_price_min: freshMin,
      });
    }

    if (alerts.length === 0) {
      return Response.json({ message: 'No price drops detected.', checked: savedProducts.length });
    }

    // Fetch users for all affected user_ids
    const userIds = [...new Set(alerts.map(a => a.saved.user_id))];
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    for (const u of allUsers) userMap[u.id] = u;

    // Group alerts by user
    const byUser = {};
    for (const alert of alerts) {
      const uid = alert.saved.user_id;
      if (!byUser[uid]) byUser[uid] = [];
      byUser[uid].push(alert);
    }

    let emailsSent = 0;
    let notificationsSaved = 0;

    for (const [userId, userAlerts] of Object.entries(byUser)) {
      const user = userMap[userId];
      if (!user) continue;

      const lines = userAlerts.map(a =>
        `• ${a.saved.brand_name || a.circle?.name} — "${a.saved.product_category}": price dropped ~${a.dropPct}% (was ~$${a.savedMin}, now ~$${a.freshMin})`
      ).join('\n');

      // In-app notification
      for (const a of userAlerts) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          type: 'new_post',
          message: `💸 Price drop! "${a.saved.product_category}" at ${a.saved.brand_name || a.circle?.name} dropped ~${a.dropPct}% — check it out!`,
          circle_id: a.saved.circle_id,
          circle_name: a.circle?.name || '',
          is_read: false,
        });
        notificationsSaved++;
      }

      // Email alert
      if (user.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          from_name: 'Investraders',
          subject: `💸 Price Drop Alert — ${userAlerts.length} product(s) you saved got cheaper!`,
          body: `Hi ${user.full_name || 'there'},\n\nGreat news! Products you've saved on Investraders have dropped in price:\n\n${lines}\n\nOpen the app to check out the latest deals.\n\n— Investraders`,
        });
        emailsSent++;
      }
    }

    return Response.json({
      message: 'Price drop alerts sent.',
      alerts_triggered: alerts.length,
      emails_sent: emailsSent,
      in_app_notifications: notificationsSaved,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});