/**
 * Reputation badge definitions and score calculator.
 * Badges are awarded based on circle activity (posts, responses, upvotes, connections).
 * Badges have tiers: Bronze, Silver, Gold, Diamond.
 */

const TIERS = [
  { name: 'Diamond', color: 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]', progressColor: 'linear-gradient(90deg, #06b6d4, #3b82f6)' },
  { name: 'Gold', color: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]', progressColor: 'linear-gradient(90deg, #f59e0b, #eab308)' },
  { name: 'Silver', color: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-200 shadow-sm', progressColor: 'linear-gradient(90deg, #94a3b8, #64748b)' },
  { name: 'Bronze', color: 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 border-orange-200 shadow-sm', progressColor: 'linear-gradient(90deg, #f97316, #d97706)' },
];

export const BADGES = [
  {
    id: 'top_contributor',
    label: 'Contributor',
    emoji: '🏆',
    description: 'Awarded for posting frequently in circles.',
    thresholds: [500, 150, 50, 10], // Diamond, Gold, Silver, Bronze
    getValue: (stats) => stats.postCount,
  },
  {
    id: 'active_voice',
    label: 'Active Voice',
    emoji: '💬',
    description: 'Awarded for participating in discussions.',
    thresholds: [500, 150, 50, 10],
    getValue: (stats) => stats.responseCount,
  },
  {
    id: 'expert_investor',
    label: 'Expert',
    emoji: '📈',
    description: 'Earned through upvotes on helpful responses.',
    thresholds: [1000, 500, 200, 50],
    getValue: (stats) => stats.totalUpvotes,
  },
  {
    id: 'thought_leader',
    label: 'Thought Leader',
    emoji: '🧠',
    description: 'Earned when your posts are liked by many.',
    thresholds: [1000, 500, 200, 50],
    getValue: (stats) => stats.totalLikes,
  },
  {
    id: 'networker',
    label: 'Networker',
    emoji: '🤝',
    description: 'Awarded for building a strong network of connections.',
    thresholds: [500, 100, 50, 10],
    getValue: (stats) => stats.connectionsCount,
  },
  {
    id: 'circle_explorer',
    label: 'Explorer',
    emoji: '🌐',
    description: 'Member of various different circles.',
    thresholds: [50, 30, 15, 5],
    getValue: (stats) => stats.circleCount,
  },
];

export function computeReputation({ userId, posts = [], responses = [], connections = [], circles = [] }) {
  const postCount = posts.length;
  const responseCount = responses.length;
  const totalUpvotes = responses.reduce((sum, r) => sum + (r.upvoted_by?.length || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const connectionsCount = connections.filter((c) => c.status === 'accepted').length;
  const circleCount = circles.filter((c) => (c.member_ids || []).includes(userId)).length;

  const stats = { postCount, responseCount, totalUpvotes, totalLikes, connectionsCount, circleCount };
  
  const earnedBadges = [];
  
  for (const badge of BADGES) {
    const val = badge.getValue(stats);
    let earnedTierIndex = -1;
    let nextThreshold = badge.thresholds[3]; // Default to Bronze threshold

    for (let i = 0; i < badge.thresholds.length; i++) {
      if (val >= badge.thresholds[i]) {
        earnedTierIndex = i;
        nextThreshold = i > 0 ? badge.thresholds[i - 1] : null;
        break;
      }
      nextThreshold = badge.thresholds[i];
    }

    if (earnedTierIndex !== -1) {
      earnedBadges.push({
        id: badge.id,
        label: badge.label,
        emoji: badge.emoji,
        description: badge.description,
        level: TIERS[earnedTierIndex].name,
        color: TIERS[earnedTierIndex].color,
        progressColor: TIERS[earnedTierIndex].progressColor,
        value: val,
        nextThreshold,
      });
    }
  }

  return { stats, earnedBadges };
}