import React, { useMemo, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simulated live comments that float up (replace with real data if available)
const SAMPLE_COMMENTS = [
  "Great insight! 🔥",
  "Totally agree with this",
  "What about inflation? 📈",
  "Buying the dip 💎",
  "This is bullish 🚀",
  "Long term hold!",
  "Market timing is key",
  "Risk management first",
  "Love this circle ❤️",
  "More analysis please!",
];

const AVATAR_COLORS = [
  'linear-gradient(135deg,#E8A87C,#d4843a)',
  'linear-gradient(135deg,#7EB5D6,#3a8fc8)',
  'linear-gradient(135deg,#6BAF92,#2e8a5c)',
  'linear-gradient(135deg,#D4A5C9,#a855c8)',
  'linear-gradient(135deg,#F0C987,#e0a030)',
  'linear-gradient(135deg,#9BB5CE,#4a7aaa)',
  'linear-gradient(135deg,#E8927C,#d44a2a)',
  'linear-gradient(135deg,#8DB8A3,#3a8a6a)',
  'linear-gradient(135deg,#C9A5D4,#8844bb)',
  'linear-gradient(135deg,#7CC4E8,#2288cc)',
  'linear-gradient(135deg,#D6A57E,#bb6622)',
  'linear-gradient(135deg,#a5d4c9,#2a9a8a)',
];

function CountdownTimer({ closesAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      if (!closesAt) { setTimeLeft('00:00:00'); return; }
      const diff = new Date(closesAt) - new Date();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [closesAt]);
  return <span className="font-mono font-bold text-white text-sm tracking-wide">{timeLeft}</span>;
}

// Floating comment caption that drifts up and fades out
function FloatingComment({ comment, x, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: -120, scale: [0.8, 1, 1, 0.9] }}
      transition={{ duration: 3.2, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
      onAnimationComplete={onDone}
      style={{ left: x, bottom: 0, position: 'absolute', pointerEvents: 'none', zIndex: 30 }}
    >
      <div
        className="text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg"
        style={{
          background: 'rgba(10,30,80,0.78)',
          border: '1px solid rgba(100,180,255,0.35)',
          backdropFilter: 'blur(8px)',
          maxWidth: 180,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {comment}
      </div>
    </motion.div>
  );
}

// Single avatar slot — placed at a fixed angle, counter-rotates to stay upright
function AvatarSlot({ member, index, total, orbitRadius, avatarSize }) {
  const bgGradient = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const isActive = member?.isActive;
  // Fixed angle on the ring — perfectly symmetric
  const angleDeg = (index / total) * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  const x = Math.cos(angleRad) * orbitRadius;
  const y = Math.sin(angleRad) * orbitRadius;

  return (
    <div
      className="absolute"
      style={{
        left: `calc(50% + ${x}px - ${avatarSize / 2}px)`,
        top: `calc(50% + ${y}px - ${avatarSize / 2}px)`,
        width: avatarSize,
        height: avatarSize,
        // Counter-rotate to keep face upright while parent ring rotates
        animation: `counterCW 22s linear infinite`,
      }}
    >
      {isActive && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ boxShadow: `0 0 0 3px #22c55e, 0 0 16px 6px rgba(34,197,94,0.6)` }}
        />
      )}
      {member?.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member?.name}
          className="rounded-full object-cover shadow-2xl"
          style={{
            width: avatarSize, height: avatarSize,
            border: isActive ? '3px solid #22c55e' : '2.5px solid rgba(255,255,255,0.85)',
            boxShadow: isActive ? '0 0 0 2px #22c55e, 0 4px 20px rgba(34,197,94,0.4)' : '0 4px 20px rgba(0,0,0,0.4)',
          }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-bold shadow-2xl"
          style={{
            width: avatarSize, height: avatarSize,
            background: bgGradient,
            border: isActive ? '3px solid #22c55e' : '2.5px solid rgba(255,255,255,0.85)',
            boxShadow: isActive ? '0 0 0 2px #22c55e, 0 4px 20px rgba(34,197,94,0.4)' : '0 4px 20px rgba(0,0,0,0.35)',
            fontSize: avatarSize * 0.38,
            color: 'white',
          }}
        >
          {member?.name?.charAt(0)?.toUpperCase() || '·'}
        </div>
      )}
      {member?.name && (
        <div
          className="absolute text-center whitespace-nowrap"
          style={{
            top: avatarSize + 3,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.95)',
            fontSize: 9,
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,20,0.55)',
            borderRadius: 6,
            padding: '1px 5px',
          }}
        >
          {member.name.split(' ')[0]}
        </div>
      )}
    </div>
  );
}

export default function CircleVisual({
  members = [],
  question,
  selectedResponse,
  questionNumber,
  closesAt,
  totalResponses = 0,
  totalMembers = 0,
  circleName,
  memberProfiles = [],
}) {
  const SIZE = 380;
  const SPHERE_SIZE = 220;
  const ORBIT_RADIUS = SPHERE_SIZE / 2 + 52;
  const AVATAR_SIZE = 52;

  // Live floating comments state
  const [liveComments, setLiveComments] = useState([]);
  const commentIdRef = useRef(0);

  // Simulate or use real active member comments
  const activeMembers = members.filter((m) => m?.isActive);

  useEffect(() => {
    // Spawn a floating comment every 1.8s
    const interval = setInterval(() => {
      const source = activeMembers.length > 0 ? activeMembers : members.filter(Boolean);
      if (source.length === 0) return;
      const member = source[Math.floor(Math.random() * source.length)];
      const comment = member?.lastComment || SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
      const id = ++commentIdRef.current;
      const x = 20 + Math.random() * (SIZE - 200);
      setLiveComments((prev) => [...prev.slice(-8), { id, text: comment, x, name: member?.name }]);
    }, 1800);
    return () => clearInterval(interval);
  }, [members.length, activeMembers.length]);

  const removeComment = (id) => setLiveComments((prev) => prev.filter((c) => c.id !== id));

  // Use up to 12 member slots on the orbit
  const orbitSlots = Array.from({ length: Math.max(members.length, 1) }).map((_, i) => members[i] || null);
  const displaySlots = orbitSlots.slice(0, 12);

  return (
    <div className="flex flex-col items-center bg-white py-8 px-4 select-none">
      {/* Inject keyframes */}
      <style>{`
        @keyframes orbitCW {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes counterCW {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes sphereGlow {
          0%, 100% { box-shadow: 0 0 60px 20px rgba(30,100,255,0.35), inset 0 0 40px rgba(100,180,255,0.15); }
          50%       { box-shadow: 0 0 90px 30px rgba(30,100,255,0.55), inset 0 0 60px rgba(100,180,255,0.25); }
        }
        @keyframes ringRotate {
          from { transform: rotateX(75deg) rotateZ(0deg); }
          to   { transform: rotateX(75deg) rotateZ(360deg); }
        }
      `}</style>

      {/* Circle Title */}
      <h2 className="text-4xl font-bold mb-6" style={{ color: '#3B9EE8' }}>
        {circleName || `Circle ${questionNumber || ''}`}
      </h2>

      {/* Main container — relative, holds orbit + sphere + floating comments */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* ── Orbiting ring: single wrapper rotates CW, avatars counter-rotate to stay upright ── */}
        <div
          className="absolute inset-0"
          style={{ animation: 'orbitCW 22s linear infinite' }}
        >
          {displaySlots.map((member, i) => (
            <AvatarSlot
              key={i}
              member={member}
              index={i}
              total={displaySlots.length}
              orbitRadius={ORBIT_RADIUS}
              avatarSize={AVATAR_SIZE}
            />
          ))}
        </div>

        {/* ── 3D Sphere (CSS perspective trick) ── */}
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: SPHERE_SIZE,
            height: SPHERE_SIZE,
            background: `
              radial-gradient(circle at 35% 30%,
                #7DC8F5 0%,
                #3A8FD4 18%,
                #1A5FA8 42%,
                #0D3F7A 70%,
                #071E45 100%
              )
            `,
            boxShadow: `
              0 0 60px 20px rgba(30,100,255,0.35),
              inset -20px -20px 60px rgba(0,0,60,0.6),
              inset 10px 10px 30px rgba(120,200,255,0.2)
            `,
            animation: 'sphereGlow 3s ease-in-out infinite',
          }}
        >
          {/* Shiny specular highlight */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: SPHERE_SIZE * 0.45,
              height: SPHERE_SIZE * 0.35,
              top: '12%',
              left: '18%',
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.35) 0%, transparent 70%)',
              filter: 'blur(6px)',
            }}
          />

          {/* Equator ring (CSS 3D) */}
          <div
            style={{
              position: 'absolute',
              width: SPHERE_SIZE * 0.92,
              height: SPHERE_SIZE * 0.92,
              borderRadius: '50%',
              border: '2px solid rgba(100,180,255,0.35)',
              animation: 'ringRotate 12s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          />

          {/* Tilted meridian ring */}
          <div
            style={{
              position: 'absolute',
              width: SPHERE_SIZE * 0.92,
              height: SPHERE_SIZE * 0.92,
              borderRadius: '50%',
              border: '1.5px solid rgba(100,180,255,0.2)',
              animation: 'ringRotate 18s linear infinite reverse',
              transformStyle: 'preserve-3d',
              transform: 'rotateX(75deg) rotateY(45deg)',
            }}
          />

          {/* Center text content */}
          <div
            className="absolute flex flex-col items-center justify-center text-center px-6"
            style={{ inset: 0 }}
          >
            {selectedResponse ? (
              <>
                {(() => {
                  const responderProfile = memberProfiles.find((p) => p.id === selectedResponse.created_by_id);
                  const avatar = responderProfile?.avatar_url || selectedResponse.author_avatar;
                  return avatar ? (
                    <img src={avatar} alt={selectedResponse.author_name} className="w-14 h-14 rounded-full object-cover mb-2 border-2 border-white/60 shadow-lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 border-2 border-white/40 shadow-lg" style={{ background: 'linear-gradient(135deg,#F5A623,#E8821A)' }}>
                      {selectedResponse.author_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  );
                })()}
                <p className="text-white/80 text-xs font-medium underline underline-offset-2 mb-1">{selectedResponse.author_name}</p>
                <p className="text-white text-sm font-semibold leading-snug line-clamp-4">{selectedResponse.response_text}</p>
              </>
            ) : (
              <>
                {questionNumber && <p className="text-blue-200/80 text-xs font-medium mb-1">Q. {questionNumber}</p>}
                <p className="text-white text-base font-bold leading-snug line-clamp-4">{question || 'No question yet'}</p>
              </>
            )}

            {/* Countdown */}
            <div className="absolute bottom-7 text-center">
              <CountdownTimer closesAt={closesAt} />
              <p className="text-blue-200/70 text-[10px] mt-0.5">left to close</p>
            </div>
          </div>
        </div>

        {/* ── Floating live comments (Facebook Live style) ── */}
        <div
          className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none"
          style={{ height: SIZE, zIndex: 20 }}
        >
          <AnimatePresence>
            {liveComments.map((c) => (
              <FloatingComment
                key={c.id}
                comment={`${c.name ? c.name.split(' ')[0] + ': ' : ''}${c.text}`}
                x={c.x}
                onDone={() => removeComment(c.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Total Response pill */}
      <div className="mt-10 flex flex-col items-center gap-1.5">
        <p className="text-sm font-medium" style={{ color: '#3B9EE8' }}>Total Response</p>
        <div
          className="px-10 py-2.5 rounded-full text-white font-bold text-2xl shadow-lg"
          style={{
            background: 'linear-gradient(90deg,#1A4E8A 0%,#2E7EC8 60%,#3B9EE8 100%)',
            minWidth: 160,
            textAlign: 'center',
          }}
        >
          {totalResponses} / {totalMembers}
        </div>
      </div>
    </div>
  );
}