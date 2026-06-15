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

    // Use service role to clean up expired stories
    const allStories = await base44.asServiceRole.entities.Story.list();
    const now = new Date();
    const expired = allStories.filter((s) => s.expires_at && new Date(s.expires_at) < now);

    if (expired.length === 0) {
      return Response.json({ deleted: 0, message: 'No expired stories found' });
    }

    await Promise.all(expired.map((s) => base44.asServiceRole.entities.Story.delete(s.id)));

    return Response.json({ deleted: expired.length, message: `Cleaned up ${expired.length} expired stories` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});