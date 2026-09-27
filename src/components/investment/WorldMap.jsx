import React from 'react';
import { Maximize2 } from 'lucide-react';

const W = 1000, H = 500;
const px = (lng) => ((lng + 180) / 360) * W;
const py = (lat) => ((90 - lat) / 180) * H;

const toPath = (pts) =>
  pts.map(([lng, lat], i) => `${i ? 'L' : 'M'}${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(' ') + ' Z';

const LAND = [
  // North America
  [[-168,65],[-164,60],[-156,57],[-148,60],[-136,58],[-128,53],[-124,48],[-122,40],[-118,34],[-114,29],[-112,25],[-106,23],[-100,19],[-95,17],[-92,15],[-87,13],[-83,9],[-79,9],[-78,8],[-83,10],[-86,12],[-88,16],[-88,21],[-91,19],[-95,19],[-97,22],[-97,26],[-94,29],[-89,29],[-85,30],[-82,27],[-80,25],[-81,31],[-76,35],[-74,40],[-70,43],[-66,45],[-60,47],[-56,49],[-56,54],[-64,60],[-64,62],[-70,68],[-85,70],[-100,68],[-115,69],[-130,70],[-145,70],[-160,70]],
  // Greenland
  [[-45,60],[-30,68],[-20,72],[-22,80],[-35,83],[-52,82],[-58,76],[-55,68],[-50,62]],
  // South America
  [[-79,9],[-78,1],[-81,-4],[-75,-14],[-70,-18],[-70,-24],[-71,-30],[-73,-37],[-74,-45],[-75,-52],[-69,-55],[-65,-52],[-62,-40],[-57,-38],[-53,-34],[-48,-27],[-40,-21],[-35,-8],[-38,-5],[-45,-2],[-50,0],[-52,4],[-58,7],[-62,10],[-68,11],[-72,12],[-75,10]],
  // Africa
  [[-17,15],[-16,21],[-13,25],[-10,30],[-6,36],[3,37],[10,34],[20,32],[25,32],[32,31],[35,25],[37,18],[43,12],[48,12],[51,11],[48,4],[42,-1],[41,-8],[40,-16],[35,-22],[32,-26],[30,-31],[26,-34],[18,-34],[15,-27],[12,-18],[11,-5],[9,4],[6,4],[0,5],[-5,5],[-8,5],[-13,9]],
  // Eurasia
  [[-6,36],[0,39],[3,42],[6,43],[9,44],[12,44],[13,38],[16,38],[19,40],[23,38],[26,40],[29,41],[33,36],[36,36],[36,31],[38,25],[42,17],[45,12],[52,16],[57,23],[59,25],[57,25],[61,25],[67,24],[72,20],[73,16],[76,10],[77,8],[80,13],[85,20],[88,22],[92,21],[97,16],[98,8],[100,3],[104,10],[108,15],[110,20],[117,23],[122,31],[122,40],[128,42],[135,45],[140,50],[143,53],[150,59],[160,60],[170,63],[178,65],[180,67],[160,71],[140,73],[120,75],[100,76],[80,74],[60,70],[40,68],[30,70],[20,70],[10,63],[5,58],[8,54],[4,52],[0,49],[-2,43],[-9,43],[-9,37]],
  // British Isles
  [[-10,51],[-6,55],[-2,58],[0,54],[-2,51],[-6,50]],
  // Australia
  [[113,-22],[114,-27],[116,-32],[120,-34],[126,-32],[132,-32],[138,-35],[141,-38],[147,-38],[150,-37],[153,-28],[153,-25],[146,-19],[142,-11],[137,-12],[132,-11],[130,-13],[126,-14],[122,-17],[118,-20]],
  // Indonesia / New Guinea
  [[95,5],[104,-2],[115,-9],[130,-8],[141,-9],[147,-8],[141,-3],[130,-1],[118,1],[105,2],[98,4]],
  // Madagascar
  [[43,-12],[50,-15],[50,-25],[45,-25],[43,-18]],
  // Japan
  [[130,31],[136,35],[141,40],[145,44],[142,45],[138,37],[132,34]],
  // New Zealand
  [[173,-35],[178,-38],[174,-41],[170,-46],[166,-46],[171,-42]],
];

const TUNISIA = { lng: 9.5, lat: 34.0 };

export default function WorldMap({ onOpen }) {
  const tx = px(TUNISIA.lng);
  const ty = py(TUNISIA.lat);

  return (
    <div
      className="relative w-full rounded-2xl border overflow-hidden shadow-sm"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #ecfeff 0%, #f8fafc 60%, #eef2f7 100%)' }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px] sm:h-[380px] lg:h-[440px]">
        <defs>
          <pattern id="worldGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#0891b2" strokeWidth="0.6" opacity="0.08" />
          </pattern>
          <radialGradient id="tunisiaGlow">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#worldGrid)" />

        {LAND.map((poly, i) => (
          <path key={i} d={toPath(poly)} fill="#c7d5e0" stroke="#9fb4c4" strokeWidth="0.8" strokeLinejoin="round" />
        ))}

        <circle cx={tx} cy={ty} r="48" fill="url(#tunisiaGlow)" />
        <g style={{ cursor: 'pointer' }} onClick={() => onOpen && onOpen()}>
          <circle cx={tx} cy={ty} r="22" fill="transparent" />
          <circle cx={tx} cy={ty} r="8" fill="#d4af37" opacity="0.35">
            <animate attributeName="r" values="8;24;8" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0;0.45" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={tx} cy={ty} r="5.5" fill="#d4af37" stroke="#ffffff" strokeWidth="2" />
          <text
            x={tx}
            y={ty - 16}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#0f172a"
            style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 4 }}
          >
            Tunisia
          </text>
        </g>
      </svg>

      <div className="absolute bottom-3 left-3 rounded-xl border bg-card/95 backdrop-blur px-3 py-2 text-[11px] text-muted-foreground shadow-sm">
        Click Tunisia to open the full governorate map
      </div>

      <button
        onClick={() => onOpen && onOpen()}
        className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-lg border bg-card/95 backdrop-blur px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors shadow-sm"
      >
        <Maximize2 className="w-3.5 h-3.5" /> Open Tunisia map
      </button>
    </div>
  );
}
