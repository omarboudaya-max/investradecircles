/**
 * Platform actions shared by several pages: introductions, training registrations,
 * post reports, matching preferences and circle notifications.
 *
 * Tables introduced by supabase/migrations (IntroRequest, TrainingRegistration,
 * PostReport, profiles.match_profile) are used when present. Until that migration
 * has been applied the helpers fall back to tables that already exist, so the
 * features keep working either way.
 */

import { supabase } from '@/lib/supabase';

// PostgREST reports a missing table / column with these codes.
const MISSING = new Set(['PGRST205', 'PGRST204', '42P01', '42703']);
export const isMissingSchema = (error) => Boolean(error) && (MISSING.has(error.code) || /could not find the (table|.*column)|does not exist/i.test(error.message || ''));

const displayName = (user) => user?.full_name || user?.email?.split('@')[0] || 'A member';

async function notify(rows) {
  const clean = rows.filter((r) => r && r.user_id);
  if (!clean.length) return;
  const { error } = await supabase.from('Notification').insert(clean);
  if (error) console.warn('Notification insert failed:', error.message);
}

async function adminIds() {
  const { data } = await supabase.from('profiles').select('id').eq('role', 'admin');
  return (data || []).map((p) => p.id);
}

/** Only in-app paths are allowed as notification targets. */
export function safeInternalPath(path) {
  return typeof path === 'string' && /^\/(?!\/)[\w\-./?=&%#:@+~]*$/.test(path) ? path : null;
}

// ── Introductions ───────────────────────────────────────────────────────────

/**
 * Ask to be introduced to the owner of a match (investor, fund, project, post author or member).
 * The owner is notified directly when they have an account; otherwise platform administrators
 * are notified so they can broker the introduction.
 */
export async function requestIntroduction({ user, match, message = '', context = {} }) {
  if (!user?.id) throw new Error('Please sign in to request an introduction.');
  if (!match) throw new Error('Nothing to request.');
  const entity = match.entity || {};
  const targetUserId = match.ownerUserId && match.ownerUserId !== user.id ? match.ownerUserId : null;
  const row = {
    requester_id: user.id,
    requester_name: displayName(user),
    target_kind: match.kind,
    target_id: String(entity.id ?? match.id),
    target_title: match.title,
    target_user_id: targetUserId,
    match_score: Math.round(match.matchScore ?? 0),
    message: message.trim().slice(0, 2000),
    context,
    status: 'NEW',
  };

  let stored = false;
  const { error } = await supabase.from('IntroRequest').insert(row);
  if (!error) stored = true;
  else if (error.code === '23505') return { stored: true, deliveredTo: targetUserId ? 'owner' : 'admins', duplicate: true };
  else if (!isMissingSchema(error)) throw new Error(error.message);

  // Projects also feed the promoter's interest pipeline, which predates IntroRequest.
  if (match.kind === 'project') {
    const { error: interestError } = await supabase.from('InvestorInterest').insert({
      project_id: entity.id,
      project_title: entity.title,
      investor_user_id: user.id,
      investor_name: displayName(user),
      investor_email: user.email || null,
      interest_type: context.objective === 'CAPITAL_ALLOCATION' ? 'EQUITY' : 'PARTNERSHIP',
      message: row.message,
      status: 'NEW',
    });
    if (!interestError) stored = true;
  }

  const text = `${row.requester_name} requested an introduction regarding “${match.title}”${row.match_score ? ` (${row.match_score}% match)` : ''}`;
  if (targetUserId) {
    await notify([{ user_id: targetUserId, type: 'intro_request', message: text, target_url: `/profile/${user.id}`, is_read: false }]);
  } else {
    const admins = (await adminIds()).filter((id) => id !== user.id);
    await notify(admins.map((id) => ({
      user_id: id, type: 'intro_request', is_read: false, target_url: '/admin?tab=Introductions',
      message: `${text} — the listing has no account owner, please broker this introduction.`,
    })));
    stored = stored || admins.length > 0;
  }

  return { stored, deliveredTo: targetUserId ? 'owner' : 'admins' };
}

export async function listIntroRequests({ limit = 200 } = {}) {
  const { data, error } = await supabase.from('IntroRequest').select('*').order('created_date', { ascending: false }).limit(limit);
  if (error) return { rows: [], available: !isMissingSchema(error), error: isMissingSchema(error) ? null : error.message };
  return { rows: data || [], available: true, error: null };
}

export async function updateIntroRequestStatus(id, status) {
  const { error } = await supabase.from('IntroRequest').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Matching preferences ────────────────────────────────────────────────────

/** Persist what a member is looking for so other members can be matched against it. */
export async function saveMatchProfile(user, matchProfile) {
  if (!user?.id) return { savedTo: 'none' };
  const payload = { ...matchProfile, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('profiles').update({ match_profile: payload }).eq('id', user.id);
  if (!error) return { savedTo: 'profile' };
  if (!isMissingSchema(error)) throw new Error(error.message);
  // Column not there yet: keep the preferences on the auth account so they survive across devices.
  const { error: metaError } = await supabase.auth.updateUser({ data: { match_profile: payload } });
  if (metaError) throw new Error(metaError.message);
  return { savedTo: 'account' };
}

// ── Circle notifications ────────────────────────────────────────────────────

/**
 * Notify every member of a circle about something the current user just did.
 * Called once by the author's client — never from a realtime listener, which would
 * multiply the notification by the number of people watching the circle.
 */
export async function notifyCircleMembers({ circle, authorId, message, type, targetUrl }) {
  if (!circle?.id) return;
  const recipients = new Set([...(circle.member_ids || []), circle.created_by_id].filter(Boolean));
  recipients.delete(authorId);
  await notify([...recipients].map((userId) => ({
    user_id: userId, type, message, circle_id: circle.id, circle_name: circle.name,
    target_url: safeInternalPath(targetUrl) || `/circle/${circle.id}`, is_read: false,
  })));
}

// ── Training registrations (chamber academies) ──────────────────────────────

export async function registerForTraining({ user, circle, course, form }) {
  const row = {
    circle_id: circle?.id || null,
    user_id: user?.id || null,
    course_title: course.title,
    full_name: form.fullName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    company: (form.company || '').trim() || null,
    status: 'NEW',
  };
  const { error } = await supabase.from('TrainingRegistration').insert(row);
  if (error && !isMissingSchema(error)) throw new Error(error.message);

  // The circle's managers are told either way so the request reaches a human.
  const managers = new Set([circle?.created_by_id, ...(circle?.moderator_ids || [])].filter(Boolean));
  if (user?.id) managers.delete(user.id);
  await notify([...managers].map((id) => ({
    user_id: id, type: 'training_registration', circle_id: circle?.id || null, circle_name: circle?.name || null, is_read: false,
    target_url: circle?.id ? `/circle/${circle.id}` : null,
    message: `${row.full_name}${row.company ? ` (${row.company})` : ''} registered for “${row.course_title}” — ${row.email}, ${row.phone}`,
  })));
  return { stored: !error, notified: managers.size };
}

export async function listTrainingRegistrations(circleId) {
  const { data, error } = await supabase.from('TrainingRegistration').select('*').eq('circle_id', circleId).order('created_date', { ascending: false });
  if (error) return { rows: [], available: !isMissingSchema(error) };
  return { rows: data || [], available: true };
}

// ── Reports ─────────────────────────────────────────────────────────────────

export async function reportPost({ user, post, reason = '' }) {
  if (!user?.id) throw new Error('Please sign in to report a post.');
  const { error } = await supabase.from('PostReport').insert({
    post_id: post.id, reporter_id: user.id, reason: reason.slice(0, 500), status: 'NEW',
  });
  if (error && !isMissingSchema(error) && error.code !== '23505') throw new Error(error.message);
  const admins = (await adminIds()).filter((id) => id !== user.id);
  await notify(admins.map((id) => ({
    user_id: id, type: 'post_report', is_read: false, target_url: `/post/${post.id}`,
    message: `${displayName(user)} reported a post by ${post.author_name || 'a member'}${reason ? `: ${reason.slice(0, 120)}` : ''}`,
  })));
  return { stored: !error };
}
