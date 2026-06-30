import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Users, ArrowLeft, Landmark, User, Globe, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import TagPicker from '@/components/circles/TagPicker';
import InviteFriendsModal from '@/components/circles/InviteFriendsModal';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = [
  {
    value: 'institution',
    Icon: Landmark,
    gradient: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
    iconColor: 'text-amber-300',
    borderColor: 'border-amber-400/40',
  },
  {
    value: 'individual',
    Icon: User,
    gradient: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
    iconColor: 'text-blue-100',
    borderColor: 'border-blue-400/30',
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
  const t = useTranslation();
  const { isArabic } = useLanguage();

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
      setError(err?.message || t.createCircle.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`max-w-xl mx-auto ${isArabic ? 'text-right' : 'text-left'}`}>
        <Link to="/home" className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6`}>
          <ArrowLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} /> {t.createCircle.backToHome}
        </Link>

        <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8">
          <div className={`flex items-center gap-3 mb-6`}>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.createCircle.title}</h1>
              <p className="text-sm text-muted-foreground">{t.createCircle.subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={`space-y-5 ${isArabic ? 'text-right' : 'text-left'}`}>
            {/* Category Selection — prominent cards */}
            <div>
              <Label className="mb-2 block">{t.createCircle.category}</Label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(({ value, Icon, gradient, iconColor, borderColor }) => {
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
                      <p className="font-semibold text-sm">{value === 'institution' ? t.createCircle.institution : t.createCircle.individual}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{value === 'institution' ? t.createCircle.institutionDesc : t.createCircle.individualDesc}</p>
                      {selected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-card" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">{t.createCircle.name}</Label>
              <Input
                placeholder={isInstitution ? t.createCircle.nameInstPlaceholder : t.createCircle.nameIndPlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                dir={isArabic ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">{t.createCircle.description}</Label>
              <Textarea
                placeholder={t.createCircle.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                dir={isArabic ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Website URL — mandatory for Institution */}
            {isInstitution && (
              <div>
                <Label className={`mb-1.5 flex items-center gap-1.5`}>
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {t.createCircle.website}
                  <span className="text-red-500 font-bold text-base leading-none">★</span>
                </Label>
                <Input
                  type="url"
                  placeholder={t.createCircle.websitePlaceholder}
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="h-12 text-left"
                  dir="ltr"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">{t.createCircle.websiteReq}</p>
              </div>
            )}

            <div>
              <Label className="mb-1.5 block">{t.createCircle.topics} <span className="text-muted-foreground font-normal">{t.createCircle.topicsDesc}</span></Label>
              <TagPicker selected={tags} onChange={setTags} />
            </div>

            <div>
              <Label className="mb-2 block">{t.createCircle.visibility}</Label>
              <RadioGroup value={privacy} onValueChange={setPrivacy} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">{t.createCircle.public}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">{t.createCircle.private}</Label>
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
              {loading ? t.createCircle.creating : t.createCircle.create}
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
