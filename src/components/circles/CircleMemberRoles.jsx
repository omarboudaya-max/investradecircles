import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Shield, Crown, User, ChevronDown, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  moderator: { label: 'Moderator', icon: Shield, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  member: { label: 'Member', icon: User, className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.className}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

function MemberRow({ userId, role, isCurrentUser, circle, canManage, displayName, avatarUrl, currentUserId }) {
  const queryClient = useQueryClient();
  const label = isCurrentUser ? `${displayName} (You)` : displayName;

  const changeRole = useMutation({
    mutationFn: async (newRole) => {
      const modIds = circle.moderator_ids || [];
      if (newRole === 'moderator') {
        if (!modIds.includes(userId)) {
          await supabase.from('Circle').update({ moderator_ids: [...modIds, userId] }).eq('id', circle.id);
        }
      } else {
        await supabase.from('Circle').update({
          moderator_ids: modIds.filter((id) => id !== userId),
        }).eq('id', circle.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle', circle.id] }),
  });

  const removeMember = useMutation({
    mutationFn: async () => {
      const members = (circle.member_ids || []).filter((id) => id !== userId);
      const mods = (circle.moderator_ids || []).filter((id) => id !== userId);
      await supabase.from('Circle').update({ member_ids: members, moderator_ids: mods }).eq('id', circle.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle', circle.id] }),
  });

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            : (displayName || 'U').charAt(0).toUpperCase()
          }
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge role={role} />
        {!isCurrentUser && (
          <Link
            to={`/profile/${userId}`}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
            title="View profile & connect"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </Link>
        )}
        {canManage && !isCurrentUser && role !== 'owner' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              {role !== 'moderator' && (
                <DropdownMenuItem onClick={() => changeRole.mutate('moderator')}>
                  <Shield className="w-3.5 h-3.5 mr-2 text-blue-600" /> Make Moderator
                </DropdownMenuItem>
              )}
              {role === 'moderator' && (
                <DropdownMenuItem onClick={() => changeRole.mutate('member')}>
                  <User className="w-3.5 h-3.5 mr-2 text-slate-500" /> Demote to Member
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => removeMember.mutate()}
                className="text-destructive focus:text-destructive"
              >
                Remove from Circle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default function CircleMemberRoles({ circle, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const isOwner = circle?.created_by_id === currentUserId;
  const isModerator = (circle?.moderator_ids || []).includes(currentUserId);
  const canManage = isOwner || isModerator;

  const memberIds = circle?.member_ids || [];
  const moderatorIds = circle?.moderator_ids || [];

  const allIds = [...new Set([...memberIds, ...(circle?.created_by_id ? [circle.created_by_id] : [])])];

  // Fetch real user profiles directly
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ['member-roles-profiles', allIds.sort().join(',')],
    queryFn: () => supabase.from('profiles').select('*').match({ id: { $in: allIds } }).then(res => res.data || []),
    enabled: allIds.length > 0,
  });

  const nameData = useMemo(() => {
    const map = {};
    memberProfiles.forEach((p) => { map[p.id] = p.full_name || p.email?.split('@')[0] || 'User'; });
    return map;
  }, [memberProfiles]);

  const avatarData = useMemo(() => {
    const map = {};
    memberProfiles.forEach((p) => { map[p.id] = p.avatar_url || null; });
    return map;
  }, [memberProfiles]);

  const getRole = (userId) => {
    if (userId === circle?.created_by_id) return 'owner';
    if (moderatorIds.includes(userId)) return 'moderator';
    return 'member';
  };

  const sorted = [...memberIds].sort((a, b) => {
    const order = { owner: 0, moderator: 1, member: 2 };
    return order[getRole(a)] - order[getRole(b)];
  });

  // Filter by search
  const filtered = search.trim()
    ? sorted.filter((uid) =>
        (nameData[uid] || '').toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  const isSearching = search.trim().length > 0;
  const displayed = isSearching || expanded ? filtered : filtered.slice(0, 4);

  return (
    <div className="px-6 pb-6">
      <div className="border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Members &amp; Roles
          </h3>
          <span className="text-xs text-muted-foreground">{memberIds.length} total</span>
        </div>

        {/* Search bar */}
        {memberIds.length > 0 && (
          <div className="px-3 py-2.5 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm rounded-full bg-muted/40 border-0 focus-visible:ring-1"
              />
            </div>
            {isSearching && filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">No members found</p>
            )}
          </div>
        )}

        <div className="px-4 py-2 flex gap-3 border-b bg-muted/20">
          {Object.keys(ROLE_CONFIG).map((key) => (
            <div key={key} className="flex items-center gap-1">
              <RoleBadge role={key} />
            </div>
          ))}
        </div>

        <div className="p-2">
          {memberIds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
          ) : (
            <>
              {!isSearching && circle?.created_by_id && !memberIds.includes(circle.created_by_id) && (
                <MemberRow
                  userId={circle.created_by_id}
                  role="owner"
                  isCurrentUser={circle.created_by_id === currentUserId}
                  circle={circle}
                  canManage={canManage}
                  displayName={nameData[circle.created_by_id] || 'User'}
                  avatarUrl={avatarData[circle.created_by_id] || null}
                  currentUserId={currentUserId}
                />
              )}
              {displayed.map((uid) => (
                <MemberRow
                  key={uid}
                  userId={uid}
                  role={getRole(uid)}
                  isCurrentUser={uid === currentUserId}
                  circle={circle}
                  canManage={canManage}
                  displayName={nameData[uid] || 'Member'}
                  avatarUrl={avatarData[uid] || null}
                  currentUserId={currentUserId}
                />
              ))}
              {!isSearching && filtered.length > 4 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full text-xs text-primary hover:underline py-2 text-center"
                >
                  {expanded ? 'Show less' : `Show ${filtered.length - 4} more`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}