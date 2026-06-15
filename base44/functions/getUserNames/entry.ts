import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_ids } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return Response.json({ names: {} });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const nameMap = {};
    users.forEach((u) => {
      if (user_ids.includes(u.id)) {
        nameMap[u.id] = u.full_name || u.email?.split('@')[0] || 'User';
      }
    });
    return Response.json({ names: nameMap });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});