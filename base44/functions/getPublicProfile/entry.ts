import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id } = await req.json();
    const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    const profile = users[0];
    if (!profile) return Response.json({ error: 'User not found' }, { status: 404 });

    return Response.json({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      bio: profile.bio || '',
      headline: profile.headline || '',
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
      cover_image_url: profile.cover_image_url || '',
      user_type: profile.user_type || '',
      business_type: profile.business_type || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});