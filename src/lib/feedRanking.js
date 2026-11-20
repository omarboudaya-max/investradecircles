/**
 * Home-feed ranking.
 *
 * Posts with more reactions rise, but age pulls every post down over time, so a
 * well-liked post stays near the top for days while new posts still get a chance.
 * Posts the member has already seen go after every unseen post: nothing is
 * repeated at the top while there is something new to show.
 */

const GRAVITY = 0.8;
const COMMENT_WEIGHT = 2;

/** Likes + emoji reactions + comments (comments count double). */
export function engagementOf(post, commentCount = 0) {
  const likes = Math.max(post.likes || 0, Array.isArray(post.liked_by) ? post.liked_by.length : 0);
  const reactions = post.reactions && typeof post.reactions === 'object'
    ? Object.values(post.reactions).reduce((sum, users) => sum + (Array.isArray(users) ? users.length : 0), 0)
    : 0;
  return likes + reactions + COMMENT_WEIGHT * commentCount;
}

export function hotScore(post, commentCount = 0, now = Date.now()) {
  const created = new Date(post.created_date).getTime();
  const ageHours = Number.isFinite(created) ? Math.max(0, (now - created) / 3_600_000) : 24 * 30;
  return (1 + engagementOf(post, commentCount)) / Math.pow(ageHours + 2, GRAVITY);
}

/**
 * @param {object[]} posts
 * @param {{ commentCounts?: Record<string, number>, seenIds?: Set<string>, now?: number }} options
 * @returns {string[]} post ids in display order
 */
export function rankFeed(posts, { commentCounts = {}, seenIds = new Set(), now = Date.now() } = {}) {
  const scored = posts.map((post) => ({ id: post.id, seen: seenIds.has(post.id), score: hotScore(post, commentCounts[post.id] || 0, now) }));
  scored.sort((a, b) => (a.seen - b.seen) || (b.score - a.score));
  return scored.map((s) => s.id);
}
