import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { Camera, ChevronRight, Loader2, UserPlus, Hash, Check } from 'lucide-react';
import ImageCropModal from '@/components/ui/ImageCropModal';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Identity
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [cropSrc, setCropSrc] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const pendingFileRef = useRef(null);

  // Step 2: Interests
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [userType, setUserType] = useState(user?.user_type || '');

  // Step 3: Communities (Circles)
  const [joinedCircles, setJoinedCircles] = useState([]);
  const { data: popularCircles = [] } = useQuery({
    queryKey: ['onboarding-circles'],
    queryFn: () => supabase.from('Circle').select('*').limit(6).then(res => res.data || []),
  });

  // Step 4: Network (People)
  const [connectedPeople, setConnectedPeople] = useState([]);
  const { data: suggestedPeople = [] } = useQuery({
    queryKey: ['onboarding-people'],
    queryFn: () => supabase.from('profiles').select('*').neq('id', user?.id).limit(6).then(res => res.data || []),
    enabled: !!user?.id,
  });

  const nextStep = () => setStep((s) => s + 1);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Update Profile
      const updates = {
        full_name: fullName,
        avatar_url: avatarUrl,
        headline,
        bio,
        user_type: userType,
        is_onboarded: true,
      };
      await supabase.from('profiles').update(updates).eq('id', user.id);
      await supabase.auth.updateUser({ data: updates });

      // 2. Join Circles
      for (const circleId of joinedCircles) {
        const circle = popularCircles.find(c => c.id === circleId);
        if (circle) {
          await supabase.from('Circle').update({
            member_ids: [...new Set([...(circle.member_ids || []), user.id])]
          }).eq('id', circleId);
        }
      }

      // 3. Connect People
      for (const personId of connectedPeople) {
        await supabase.from('Connection').insert({
          requester_id: user.id,
          recipient_id: personId,
          status: 'pending'
        });
        await supabase.from('Notification').insert({
          user_id: personId,
          type: 'connection_request',
          message: `${fullName || user.email?.split('@')[0] || 'Someone'} sent you a connection request`,
          is_read: false,
        });
      }

      await refreshProfile();
      navigate('/');
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file) => {
    pendingFileRef.current = file;
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploadingImage(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const filePath = `avatar_${user.id}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('media').upload(filePath, file);
      if (error) throw error;
      const url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
      setAvatarUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-200 fixed top-0 z-50">
        <motion.div 
          className="h-full bg-blue-600" 
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center pt-20 pb-10 px-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border overflow-hidden">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" className="p-8">
                <h1 className="text-2xl font-bold mb-2">Welcome to Investraders! 🎉</h1>
                <p className="text-muted-foreground mb-8">Let's set up your profile so people can recognize you.</p>

                <div className="flex flex-col items-center mb-8">
                  <div className="relative w-28 h-28 mb-4">
                    <div className="w-full h-full rounded-full border-4 border-slate-100 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserPlus className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-md">
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                    </label>
                  </div>
                  <Input 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="Your Full Name" 
                    className="max-w-xs text-center font-medium"
                  />
                </div>

                <div className="flex justify-between items-center mt-12">
                  <Button variant="ghost" onClick={nextStep} className="text-slate-400 hover:text-slate-600">Skip</Button>
                  <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">Continue</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" className="p-8">
                <h1 className="text-2xl font-bold mb-2">What brings you here?</h1>
                <p className="text-muted-foreground mb-8">Add a quick headline and bio so others know your background.</p>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">I am a...</label>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setUserType('investor')}
                        className={`flex-1 py-3 border rounded-xl font-medium transition-colors ${userType === 'investor' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-slate-50'}`}
                      >
                        💼 Investor
                      </button>
                      <button 
                        onClick={() => setUserType('innovator')}
                        className={`flex-1 py-3 border rounded-xl font-medium transition-colors ${userType === 'innovator' ? 'bg-cyan-50 border-cyan-600 text-cyan-700' : 'hover:bg-slate-50'}`}
                      >
                        🚀 Innovator
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Headline</label>
                    <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Crypto Enthusiast & Angel Investor" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Bio</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your story..." className="h-24 resize-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-12">
                  <Button variant="ghost" onClick={nextStep} className="text-slate-400 hover:text-slate-600">Skip</Button>
                  <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">Continue</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" className="p-8">
                <h1 className="text-2xl font-bold mb-2">Join Communities</h1>
                <p className="text-muted-foreground mb-8">Follow circles that match your interests.</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {popularCircles.map(circle => {
                    const selected = joinedCircles.includes(circle.id);
                    return (
                      <div 
                        key={circle.id} 
                        onClick={() => setJoinedCircles(prev => selected ? prev.filter(id => id !== circle.id) : [...prev, circle.id])}
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${selected ? 'border-blue-600 bg-blue-50/50' : 'hover:border-blue-300'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-bold">
                            {circle.name.charAt(0)}
                          </div>
                          {selected && <Check className="w-5 h-5 text-blue-600" />}
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1">{circle.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{circle.category || 'General'}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <Button variant="ghost" onClick={nextStep} className="text-slate-400 hover:text-slate-600">Skip</Button>
                  <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8">Continue</Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" className="p-8">
                <h1 className="text-2xl font-bold mb-2">Build Your Network</h1>
                <p className="text-muted-foreground mb-8">Connect with peers to see their posts and updates.</p>

                <div className="space-y-3 mb-8">
                  {suggestedPeople.map(person => {
                    const selected = connectedPeople.includes(person.id);
                    return (
                      <div key={person.id} className="flex items-center justify-between p-3 border rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                            {person.avatar_url ? <img src={person.avatar_url} className="w-full h-full object-cover" /> : (person.full_name || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{person.full_name || person.email.split('@')[0]}</p>
                            <p className="text-xs text-muted-foreground truncate">{person.headline || 'User'}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={selected ? "secondary" : "outline"} 
                          onClick={() => setConnectedPeople(prev => selected ? prev.filter(id => id !== person.id) : [...prev, person.id])}
                          className={selected ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                        >
                          {selected ? 'Added' : 'Connect'}
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <Button variant="ghost" onClick={completeOnboarding} className="text-slate-400 hover:text-slate-600" disabled={loading}>Skip</Button>
                  <Button onClick={completeOnboarding} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Done
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal 
          src={cropSrc} 
          aspect={1} 
          onConfirm={handleCropConfirm} 
          onCancel={() => setCropSrc(null)} 
        />
      )}
    </div>
  );
}
