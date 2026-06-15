import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduler (no user context) or admin users
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      // Called by scheduler without user context — allow
      isScheduled = true;
    }

    const now = new Date();
    // Window: events starting between 55 and 65 minutes from now
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);

    // Fetch all approved upcoming events
    const allEvents = await base44.asServiceRole.entities.CircleEvent.filter({ status: 'approved' });

    const upcomingEvents = allEvents.filter((e) => {
      const eventDate = new Date(e.event_date);
      return eventDate >= windowStart && eventDate <= windowEnd;
    });

    if (upcomingEvents.length === 0) {
      return Response.json({ sent: 0, message: 'No events in the reminder window.' });
    }

    // Fetch all circles once
    const allCircles = await base44.asServiceRole.entities.Circle.list();
    const circleMap = Object.fromEntries(allCircles.map((c) => [c.id, c]));

    // Fetch all users once
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u]));

    let totalSent = 0;

    for (const event of upcomingEvents) {
      const circle = circleMap[event.circle_id];
      if (!circle) continue;

      const memberIds = circle.member_ids || [];
      const eventDate = new Date(event.event_date);
      const formattedTime = eventDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });

      const eventTypeLabel = {
        discussion: 'Discussion',
        meeting: 'Meeting',
        webinar: 'Webinar',
        analysis: 'Analysis Session',
      }[event.event_type] || 'Event';

      for (const memberId of memberIds) {
        const member = userMap[memberId];
        if (!member?.email) continue;

        const firstName = member.first_name || member.full_name?.split(' ')[0] || 'Member';

        const subject = `⏰ Reminder: "${event.title}" starts in 1 hour`;
        const body = `
Hi ${firstName},

Just a reminder that a ${eventTypeLabel} in your <strong>${circle.name}</strong> circle is starting in about <strong>1 hour</strong>.

<table style="margin: 20px 0; border-left: 4px solid #2563eb; padding-left: 16px;">
  <tr><td><strong>Event:</strong> ${event.title}</td></tr>
  <tr><td><strong>Type:</strong> ${eventTypeLabel}</td></tr>
  <tr><td><strong>When:</strong> ${formattedTime}</td></tr>
  <tr><td><strong>Circle:</strong> ${circle.name}</td></tr>
  ${event.description ? `<tr><td><strong>About:</strong> ${event.description}</td></tr>` : ''}
</table>

Open Investraders and head to your <strong>${circle.name}</strong> circle to join the session.

See you there!
— The Investraders Team
        `.trim();

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: member.email,
          from_name: 'Investraders',
          subject,
          body,
        });

        totalSent++;
      }
    }

    return Response.json({
      sent: totalSent,
      events: upcomingEvents.length,
      message: `Sent ${totalSent} reminder email(s) for ${upcomingEvents.length} event(s).`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});