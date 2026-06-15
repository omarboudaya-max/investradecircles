import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // This runs as a scheduled job, use service role
    const allClicks = await base44.asServiceRole.entities.ProductClick.list('-created_date', 500);
    const allComments = await base44.asServiceRole.entities.ProductComment.list('-created_date', 500);
    const allCircles = await base44.asServiceRole.entities.Circle.list();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Group clicks by circle+product for last 1h vs previous 1h
    const clicksLastHour = allClicks.filter(c => new Date(c.created_date) >= oneHourAgo);
    const clicksPrevHour = allClicks.filter(c => new Date(c.created_date) >= twoHoursAgo && new Date(c.created_date) < oneHourAgo);

    // Group positive comments by circle+product for last 1h vs previous 1h
    const positiveLastHour = allComments.filter(c => c.sentiment === 'positive' && new Date(c.created_date) >= oneHourAgo);
    const positivePrevHour = allComments.filter(c => c.sentiment === 'positive' && new Date(c.created_date) >= twoHoursAgo && new Date(c.created_date) < oneHourAgo);

    const groupBy = (arr) => {
      const map = {};
      for (const item of arr) {
        const key = `${item.circle_id}__${item.product_category}`;
        map[key] = (map[key] || 0) + 1;
      }
      return map;
    };

    const clicksNow = groupBy(clicksLastHour);
    const clicksPrev = groupBy(clicksPrevHour);
    const sentNow = groupBy(positiveLastHour);
    const sentPrev = groupBy(positivePrevHour);

    const CLICK_SPIKE_THRESHOLD = 3;   // min clicks last hour to trigger
    const CLICK_SPIKE_MULTIPLIER = 2;  // 2x more than previous hour
    const SENTIMENT_SPIKE_THRESHOLD = 3; // min positive comments last hour

    const spikes = [];

    // Check click spikes
    for (const [key, count] of Object.entries(clicksNow)) {
      const prev = clicksPrev[key] || 0;
      if (count >= CLICK_SPIKE_THRESHOLD && count >= (prev * CLICK_SPIKE_MULTIPLIER + 1)) {
        const [circle_id, product_category] = key.split('__');
        spikes.push({ circle_id, product_category, type: 'clicks', count, prev });
      }
    }

    // Check sentiment spikes
    for (const [key, count] of Object.entries(sentNow)) {
      const prev = sentPrev[key] || 0;
      if (count >= SENTIMENT_SPIKE_THRESHOLD && count > prev) {
        const [circle_id, product_category] = key.split('__');
        // avoid duplicate spike entry for same key
        const exists = spikes.find(s => s.circle_id === circle_id && s.product_category === product_category && s.type === 'sentiment');
        if (!exists) {
          spikes.push({ circle_id, product_category, type: 'sentiment', count, prev });
        }
      }
    }

    if (spikes.length === 0) {
      return Response.json({ message: 'No spikes detected', checked_at: now.toISOString() });
    }

    // Find admin users to notify
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ message: 'No admins found', spikes });
    }

    const circleMap = {};
    for (const c of allCircles) circleMap[c.id] = c;

    // Build email body
    const spikeLines = spikes.map(s => {
      const circleName = circleMap[s.circle_id]?.name || s.circle_id;
      if (s.type === 'clicks') {
        return `• [${circleName}] "${s.product_category}" — 🔥 ${s.count} clicks in the last hour (up from ${s.prev} the hour before)`;
      } else {
        return `• [${circleName}] "${s.product_category}" — 💬 ${s.count} positive comments in the last hour (up from ${s.prev})`;
      }
    }).join('\n');

    const subject = `🚀 Product Spike Alert — ${spikes.length} product(s) trending now`;
    const body = `Hello Admin,\n\nThe following products are experiencing engagement spikes on Investraders:\n\n${spikeLines}\n\nLog in to review the activity and take action.\n\n— Investraders Automated Alerts`;

    // Send email to each admin
    for (const admin of admins) {
      if (admin.email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject,
          body,
          from_name: 'Investraders Alerts',
        });
      }
    }

    return Response.json({
      message: `Spike alerts sent to ${admins.length} admin(s)`,
      spikes_detected: spikes.length,
      spikes,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});