import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Users, ArrowLeft, Landmark, User, Globe, AlertCircle } from 'lucide-react';
import TagPicker from '@/components/circles/TagPicker';
import InviteFriendsModal from '@/components/circles/InviteFriendsModal';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = [
  {
    value: 'institution',
    label: 'Institution',
    Icon: Landmark,
    gradient: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
    iconColor: 'text-amber-300',
    borderColor: 'border-amber-400/40',
    tagline: 'Designed for chambers of commerce, stock exchanges, universities, institutions and businesses to convene members, clients and stakeholders in a branded professional space.',
  },
  {
    value: 'individual',
    label: 'Individual',
    Icon: User,
    gradient: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
    iconColor: 'text-blue-100',
    borderColor: 'border-blue-400/30',
    tagline: 'For the public to convene their community in a professional space of discussion and congregating Wise Decisions.',
  },
];

export default function CreateCircle() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('individual');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteModal, setInviteModal] = useState({ open: false, circleId: null, circleName: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  const isInstitution = category === 'institution';
  const activeMeta = CATEGORIES.find(c => c.value === category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isInstitution && !websiteUrl.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: circleData, error: insertError } = await supabase.from('Circle').insert({
        name,
        description,
        category,
        privacy,
        tags,
        created_by_id: user.id,
        member_ids: [user.id],
        ...(isInstitution && websiteUrl.trim() ? { website_url: websiteUrl.trim() } : {}),
      }).select().single();
      if (insertError) throw insertError;
      setCurrentUser(user);
      
      // Invalidate all related circle caches instantly!
      queryClient.invalidateQueries({ queryKey: ['my-circles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-circles'] });
      queryClient.invalidateQueries({ queryKey: ['all-circles'] });
      
      setInviteModal({ open: true, circleId: circleData.id, circleName: circleData.name });
    } catch (err) {
      setError(err?.message || 'Failed to create circle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-xl mx-auto">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create Circle</h1>
              <p className="text-sm text-muted-foreground">Build a community around shared interests</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Selection — prominent cards */}
            <div>
              <Label className="mb-2 block">Category</Label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(({ value, label, Icon, gradient, iconColor, borderColor, tagline }) => {
                  const selected = category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      {/* Mini gradient badge */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ background: gradient }}
                      >
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <p className="font-semibold text-sm">{label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{tagline}</p>
                      {selected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Circle Name</Label>
              <Input
                placeholder={isInstitution ? 'e.g. Lagos Chamber of Commerce' : 'e.g. Wise Investors Forum'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea
                placeholder="What's this circle about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Website URL — mandatory for Institution */}
            {isInstitution && (
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Institution Website URL
                  <span className="text-red-500 font-bold text-base leading-none">★</span>
                </Label>
                <Input
                  type="url"
                  placeholder="https://www.yourorganisation.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="h-12"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">Required for institutional circles. Must be an official URL.</p>
              </div>
            )}

            <div>
              <Label className="mb-1.5 block">Topics <span className="text-muted-foreground font-normal">(up to 5)</span></Label>
              <TagPicker selected={tags} onChange={setTags} />
            </div>

            <div>
              <Label className="mb-2 block">Privacy</Label>
              <RadioGroup value={privacy} onValueChange={setPrivacy} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">Public</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Private</Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !name.trim() || (isInstitution && !websiteUrl.trim())}
              className="w-full h-12 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold text-base shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Circle'}
            </Button>
          </form>
        </div>
      </div>

      <InviteFriendsModal
        open={inviteModal.open}
        onClose={() => { setInviteModal({ open: false, circleId: null, circleName: '' }); navigate(`/circle/${inviteModal.circleId}`); }}
        circleId={inviteModal.circleId}
        circleName={inviteModal.circleName}
        currentUser={currentUser}
      />
    </>
  );
}