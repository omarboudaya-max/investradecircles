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

    const APP_URL = Deno.env.get('APP_URL') || 'https://investraders.base44.app';

    // This runs as a scheduled job — use service role for all data access
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allCircles = await base44.asServiceRole.entities.Circle.list();
    const allPosts = await base44.asServiceRole.entities.Post.list('-likes', 200);
    const allResponses = await base44.asServiceRole.entities.CircleResponse.list('-created_date', 200);
    const allQuestions = await base44.asServiceRole.entities.CircleQuestion.list('-created_date', 100);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Filter to last 24 hours
    const recentPosts = allPosts.filter(
      (p) => p.created_date && new Date(p.created_date) >= yesterday
    );
    const recentResponses = allResponses.filter(
      (r) => r.created_date && new Date(r.created_date) >= yesterday
    );

    const circleMap = Object.fromEntries(allCircles.map((c) => [c.id, c]));
    const questionMap = Object.fromEntries(allQuestions.map((q) => [q.id, q]));

    let emailsSent = 0;

    for (const user of allUsers) {
      if (!user.email) continue;

      // Find circles this user is a member of
      const myCircles = allCircles.filter((c) => (c.member_ids || []).includes(user.id));
      if (myCircles.length === 0) continue;

      const myCircleIds = new Set(myCircles.map((c) => c.id));

      // Top posts in my circles (sorted by likes desc)
      const myPosts = recentPosts
        .filter((p) => p.circle_id && myCircleIds.has(p.circle_id))
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5);

      // Active discussions (questions with most responses)
      const responseCounts = {};
      recentResponses
        .filter((r) => r.circle_id && myCircleIds.has(r.circle_id))
        .forEach((r) => {
          responseCounts[r.question_id] = (responseCounts[r.question_id] || 0) + 1;
        });

      const activeQuestions = Object.entries(responseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([qId, count]) => ({ question: questionMap[qId], count }))
        .filter((item) => item.question);

      // Skip if nothing happened in their circles
      if (myPosts.length === 0 && activeQuestions.length === 0) continue;

      // Build HTML email
      const postsHtml = myPosts.length > 0
        ? `
          <h2 style="color:#1d4ed8;font-size:18px;margin:24px 0 12px;">🔥 Popular Posts Today</h2>
          ${myPosts.map((post) => {
            const circle = circleMap[post.circle_id];
            const circleUrl = `${APP_URL}/circle/${post.circle_id}`;
            return `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:12px;color:#64748b;background:#dbeafe;padding:2px 8px;border-radius:20px;">
                    ${circle?.name || 'Circle'}
                  </span>
                  <span style="font-size:12px;color:#ef4444;">❤️ ${post.likes || 0} likes</span>
                </div>
                <p style="color:#1e293b;font-size:14px;margin:0 0 10px;line-height:1.5;">
                  ${(post.content || '').substring(0, 180)}${post.content?.length > 180 ? '…' : ''}
                </p>
                <span style="font-size:12px;color:#64748b;">By ${post.author_name || 'Member'}</span>
                ${post.file_name ? `<div style="margin-top:8px;font-size:12px;color:#92400e;">📎 ${post.file_name}</div>` : ''}
                <div style="margin-top:12px;">
                  <a href="${circleUrl}" style="background:#1d4ed8;color:white;padding:7px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
                    View in Circle →
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        `
        : '';

      const discussionsHtml = activeQuestions.length > 0
        ? `
          <h2 style="color:#1d4ed8;font-size:18px;margin:24px 0 12px;">💬 Active Discussions</h2>
          ${activeQuestions.map(({ question, count }) => {
            const circle = circleMap[question.circle_id];
            const circleUrl = `${APP_URL}/circle/${question.circle_id}`;
            return `
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:12px;">
                <div style="margin-bottom:8px;">
                  <span style="font-size:12px;color:#64748b;background:#dcfce7;padding:2px 8px;border-radius:20px;">
                    ${circle?.name || 'Circle'}
                  </span>
                </div>
                <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0 0 8px;line-height:1.5;">
                  ${question.question_text || ''}
                </p>
                <p style="color:#16a34a;font-size:13px;margin:0 0 12px;">
                  💬 ${count} new response${count > 1 ? 's' : ''} today
                </p>
                <a href="${circleUrl}" style="background:#16a34a;color:white;padding:7px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
                  Join Discussion →
                </a>
              </div>
            `;
          }).join('')}
        `
        : '';

      const myCirclesHtml = myCircles.slice(0, 4).map((c) => `
        <a href="${APP_URL}/circle/${c.id}" style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;text-decoration:none;margin:4px;">
          ${c.name}
        </a>
      `).join('');

      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;margin:0;padding:20px;">
          <div style="max-width:600px;margin:0 auto;">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1d4ed8,#06b6d4);border-radius:16px;padding:32px;text-align:center;margin-bottom:20px;">
              <h1 style="color:white;font-size:26px;margin:0 0 6px;">📈 Investraders Daily</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">
                Your circles are buzzing — here's what happened today
              </p>
            </div>

            <!-- Greeting -->
            <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
              <p style="color:#1e293b;font-size:15px;margin:0;">
                Hey <strong>${user.full_name || 'Investor'}</strong> 👋, here's your daily summary of activity across your circles.
              </p>
            </div>

            <!-- Posts + Discussions -->
            <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
              ${postsHtml}
              ${discussionsHtml}
            </div>

            <!-- My Circles quick links -->
            <div style="background:white;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">
              <h3 style="color:#475569;font-size:14px;margin:0 0 12px;">🔗 Jump to your circles</h3>
              ${myCirclesHtml}
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding:16px;">
              <a href="${APP_URL}" style="color:#1d4ed8;font-size:13px;text-decoration:none;">
                Open Investraders
              </a>
              <p style="color:#94a3b8;font-size:11px;margin:8px 0 0;">
                You're receiving this because you're a member of active circles.
              </p>
            </div>

          </div>
        </body>
        </html>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `📈 Your Investraders Daily Summary — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
        body: emailBody,
        from_name: 'Investraders',
      });

      emailsSent++;
    }

    return Response.json({ success: true, emails_sent: emailsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});