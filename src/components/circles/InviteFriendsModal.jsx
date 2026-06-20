import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check, Upload } from 'lucide-react';
import BulkInviteModal from '@/components/circles/BulkInviteModal';

export default function InviteFriendsModal({ open, onClose, circleId, circleName, currentUser }) {
  const [search, setSearch] = useState('');
  const [invited, setInvited] = useState(new Set());
  const [showBulkInvite, setShowBulkInvite] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-invite'],
    queryFn: () => supabase.from('profiles').select('*').then(res => res.data || []),
    enabled: open,
  });

  const filtered = users.filter(u =>
    u.id !== currentUser?.id &&
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (user) => {
    if (invited.has(user.id)) return;
    await supabase.from('CircleInvite').insert({
      circle_id: circleId,
      circle_name: circleName,
      inviter_id: currentUser.id,
      inviter_name: currentUser.full_name,
      invitee_id: user.id,
      status: 'pending',
    });
    setInvited(prev => new Set([...prev, user.id]));
  };

  const handleSubmit = () => {
    onClose();
  };

  return (
    <>
    <BulkInviteModal
      open={showBulkInvite}
      onClose={() => setShowBulkInvite(false)}
      circleId={circleId}
      circleName={circleName}
      currentUser={currentUser}
    />
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-gray-700">Invite friends</DialogTitle>
        </DialogHeader>

        <button
          onClick={() => setShowBulkInvite(true)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-primary/50 text-primary text-sm font-medium rounded-xl py-2.5 mb-4 hover:bg-primary/5 transition-colors"
        >
          <Upload className="w-4 h-4" /> Bulk invite via CSV / email list
        </button>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-full border-gray-200 bg-blue-50/40"
          />
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {filtered.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={user.full_name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <span className="flex-1 font-medium text-gray-800">{user.full_name}</span>
              <button
                onClick={() => handleInvite(user)}
                className={`h-9 w-24 rounded-full text-sm font-medium border transition-colors ${
                  invited.has(user.id)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-card border-blue-400 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {invited.has(user.id) ? <Check className="w-4 h-4 mx-auto" /> : 'Invite'}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No users found</p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-11 mt-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
        >
          Submit
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}
