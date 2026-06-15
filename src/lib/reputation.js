/**
 * Reputation badge definitions and score calculator.
 * Badges are awarded based on circle activity (posts, responses, upvotes, connections).
 */

export const BADGES = [
  {
    id: 'top_contributor',
    label: 'Top Contributor',
    emoji: '🏆',
    description: 'Posted 10+ times in circles',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    check: ({ postCount }) => postCount >= 10,
  },
  {
    id: 'active_voice',
    label: 'Active Voice',
    emoji: '💬',
    description: 'Submitted 5+ discussion responses',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    check: ({ responseCount }) => responseCount >= 5,
  },
  {
    id: 'expert_investor',
    label: 'Expert Investor',
    emoji: '📈',
    description: 'Earned 20+ upvotes on responses',
    color: 'bg-green-100 text-green-800 border-green-300',
    check: ({ totalUpvotes }) => totalUpvotes >= 20,
  },
  {
    id: 'thought_leader',
    label: 'Thought Leader',
    emoji: '🧠',
    description: 'Posts liked 15+ times in total',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    check: ({ totalLikes }) => totalLikes >= 15,
  },
  {
    id: 'networker',
    label: 'Networker',
    emoji: '🤝',
    description: 'Has 5+ accepted connections',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    check: ({ connectionsCount }) => connectionsCount >= 5,
  },
  {
    id: 'circle_explorer',
    label: 'Circle Explorer',
    emoji: '🌐',
    description: 'Member of 3+ circles',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    check: ({ circleCount }) => circleCount >= 3,
  },
  {
    id: 'rising_star',
    label: 'Rising Star',
    emoji: '⭐',
    description: 'Has at least 1 post and 1 response',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
    check: ({ postCount, responseCount }) => postCount >= 1 && responseCount >= 1,
  },
];

/**
 * Compute reputation stats and earned badges for a user.
 * @param {object} params
 * @param {string}   params.userId
 * @param {Array}    params.posts        - All posts by this user
 * @param {Array}    params.responses    - All CircleResponses by this user
 * @param {Array}    params.connections  - All Connection records involving this user
 * @param {Array}    params.circles      - All circles (to count memberships)
 */
export function computeReputation({ userId, posts = [], responses = [], connections = [], circles = [] }) {
  const postCount = posts.length;
  const responseCount = responses.length;
  const totalUpvotes = responses.reduce((sum, r) => sum + (r.upvoted_by?.length || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const connectionsCount = connections.filter((c) => c.status === 'accepted').length;
  const circleCount = circles.filter((c) => (c.member_ids || []).includes(userId)).length;

  const stats = { postCount, responseCount, totalUpvotes, totalLikes, connectionsCount, circleCount };
  const earnedBadges = BADGES.filter((b) => b.check(stats));

  return { stats, earnedBadges };
}