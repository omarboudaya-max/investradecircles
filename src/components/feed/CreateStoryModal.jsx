import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, Image, Type, Loader2, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const BG_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-orange-400 to-red-500',
  'from-green-400 to-teal-500',
  'from-yellow-400 to-orange-400',
  'from-indigo-500 to-purple-600',
];

export default function CreateStoryModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [step, setStep] = useState('select'); // 'select' | 'text' | 'preview'
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState('');
  const [bgGradient, setBgGradient] = useState(BG_GRADIENTS[0]);
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const cameraInputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setPreview(URL.createObjectURL(file));
    setStep('preview');
  }, []);

  const submit = async () => {
    if (!text && !mediaFile) return;
    setLoading(true);
    let image_url = null;
    let video_url = null;
    if (mediaFile) {
      const filePath = `stories/${Date.now()}_${mediaFile.name}`;
      await supabase.storage.from('media').upload(filePath, mediaFile);
      const file_url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
      if (mediaType === 'video') video_url = file_url;
      else image_url = file_url;
    }
    const userData = await supabase.from('profiles').select('*').match({ id: user.id }).then(res => res.data || []);
    const profile = userData?.[0];
    await supabase.from('Story').insert({
      author_id: user.id,
      author_name: user.full_name || user.email?.split('@')[0],
      author_avatar: profile?.avatar_url || null,
      image_url,
      video_url,
      text: text || null,
      bg_gradient: !mediaFile ? bgGradient : null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewed_by: [],
      reactions: {},
    });
    setLoading(false);
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={onClose}>
      
      <div className="w-full h-full sm:h-[90vh] sm:w-[400px] sm:rounded-[2rem] bg-neutral-900 overflow-hidden flex flex-col relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        {/* ── STEP: SELECT / CAMERA VIEW ── */}
        {step === 'select' && (
          <div className="flex-1 flex flex-col relative">
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 pt-safe-top">
              <button onClick={onClose} className="p-2 rounded-full bg-black/20 text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Viewfinder area */}
            <div className="flex-1 bg-black flex flex-col items-center justify-center">
               <div className="flex flex-col items-center text-white/50 space-y-4">
                 <Camera className="w-16 h-16 stroke-1 text-white/20" />
                 <p className="text-sm font-medium tracking-wide">Ready to capture</p>
               </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center pb-8 z-10">
              
              <div className="flex items-center justify-between w-full px-12">
                
                {/* Gallery Button */}
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/80 hover:scale-105 transition-transform flex items-center justify-center bg-white/10 backdrop-blur"
                >
                  <Image className="w-5 h-5 text-white" />
                </button>

                {/* Main Capture Button */}
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center p-1 group hover:scale-105 transition-transform"
                >
                  <div className="w-full h-full bg-white rounded-full transition-transform group-active:scale-90" />
                </button>

                {/* Text Story Button */}
                <button 
                  onClick={() => setStep('text')}
                  className="w-10 h-10 rounded-full border border-white/30 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <Type className="w-5 h-5 text-white" />
                </button>

              </div>
            </div>

            {/* Hidden inputs */}
            <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {/* Keeping video input ref just in case but merging it to gallery button is cleaner */}
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── STEP: TEXT STORY ── */}
        {step === 'text' && (
          <div className={`flex-1 flex flex-col transition-colors duration-500 bg-gradient-to-br ${bgGradient} relative`}>
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 pt-safe-top">
              <button onClick={() => setStep('select')} className="p-2 rounded-full bg-black/20 text-white">
                <ChevronLeft className="w-7 h-7" />
              </button>
              
              <div className="flex gap-2 bg-black/20 rounded-full p-1.5 backdrop-blur-md">
                {BG_GRADIENTS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setBgGradient(g)}
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} border-2 transition-transform ${bgGradient === g ? 'border-white scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Text area */}
            <div className="flex-1 flex items-center justify-center px-6 z-0">
              <textarea
                autoFocus
                placeholder="Tap to type..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-transparent text-white text-4xl font-extrabold text-center placeholder-white/50 outline-none resize-none drop-shadow-md leading-tight"
                rows={6}
              />
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-6 inset-x-6 flex items-center justify-between z-10">
               <div className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-2 backdrop-blur-md">
                 <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=random`} alt="" className="w-6 h-6 rounded-full" />
                 <span className="text-white text-sm font-semibold">Your Story</span>
               </div>
               
               <button
                  onClick={submit}
                  disabled={!text.trim() || loading}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <ChevronLeft className="w-6 h-6 text-black rotate-180" />}
               </button>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && preview && (
          <div className="flex-1 flex flex-col bg-black relative">
            
            {/* Blurred Background underneath to fill gaps */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl transform scale-110" 
              style={{ backgroundImage: `url(${preview})` }} 
            />

            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between z-20 pt-safe-top bg-gradient-to-b from-black/50 to-transparent">
              <button onClick={() => { setStep('select'); setPreview(null); setMediaFile(null); setText(''); }} className="p-2 rounded-full bg-black/20 text-white backdrop-blur">
                <ChevronLeft className="w-7 h-7" />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 relative z-10 flex items-center justify-center overflow-hidden">
              {mediaType === 'video' ? (
                <video src={preview} autoPlay loop muted playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
              )}

              {/* Text overlay on media */}
              {text && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
                  <div className="bg-black/50 backdrop-blur-md rounded-xl px-6 py-4 text-white text-2xl font-bold text-center shadow-xl">
                    {text}
                  </div>
                </div>
              )}
            </div>

            {/* Caption Input / Controls */}
            <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-6 pt-16 px-4 flex flex-col gap-4">
              
              <input
                  placeholder="Add a caption..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-black/40 backdrop-blur-xl rounded-full px-5 py-3 text-white text-[15px] placeholder-white/70 outline-none border border-white/20 shadow-lg"
              />

              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 cursor-pointer transition-colors rounded-full px-4 py-2 backdrop-blur-md">
                   <div className="w-7 h-7 rounded-full border-2 border-green-500 overflow-hidden p-0.5">
                     <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email}&background=random`} alt="" className="w-full h-full rounded-full object-cover" />
                   </div>
                   <span className="text-white text-sm font-semibold">Your Story</span>
                 </div>
                 
                 <button
                    onClick={submit}
                    disabled={loading}
                    className="w-[46px] h-[46px] bg-white rounded-full flex items-center justify-center shadow-xl disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                 >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <ChevronLeft className="w-6 h-6 text-black rotate-180" />}
                 </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
