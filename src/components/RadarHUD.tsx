import React from 'react';
import { RadarBlip } from '../types';

interface RadarHUDProps {
  blips: RadarBlip[];
  headingDeg: number;
}

export const RadarHUD: React.FC<RadarHUDProps> = ({ blips, headingDeg }) => {
  const radarRadius = 55; // pixels
  const maxRadarDist = 160; // world meters

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Top Compass Heading Ribbon */}
      <div className="relative w-72 sm:w-96 h-8 bg-black/60 border-b border-white/20 backdrop-blur-xs flex items-center justify-center overflow-hidden rounded-t-sm shadow-md">
        <div className="absolute inset-0 flex items-center justify-center text-xs text-amber-400 font-mono tracking-widest font-bold z-10 pointer-events-none">
          ▼ {Math.round(headingDeg)}°
        </div>
        {/* Scrolling Compass Tape */}
        <div
          className="flex whitespace-nowrap text-[10px] text-zinc-300 transition-transform duration-75"
          style={{ transform: `translateX(${-((headingDeg % 360) * 1.6)}px)` }}
        >
          {Array.from({ length: 3 }).flatMap((_, loopIdx) =>
            [
              { label: 'N', deg: 0, bold: true },
              { label: '30', deg: 30 },
              { label: '60', deg: 60 },
              { label: 'E', deg: 90, bold: true },
              { label: '120', deg: 120 },
              { label: '150', deg: 150 },
              { label: 'S', deg: 180, bold: true },
              { label: '210', deg: 210 },
              { label: '240', deg: 240 },
              { label: 'W', deg: 270, bold: true },
              { label: '300', deg: 300 },
              { label: '330', deg: 330 },
            ].map((item, idx) => (
              <div
                key={`${loopIdx}-${idx}`}
                className={`inline-flex flex-col items-center w-12 ${
                  item.bold ? 'text-amber-300 font-bold font-mono' : 'text-zinc-400'
                }`}
              >
                <span>{item.label}</span>
                <span className="h-1.5 w-0.5 bg-white/30 mt-0.5"></span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Circular Tactical Radar Screen */}
      <div className="relative w-32 h-32 mt-2 bg-zinc-950/80 rounded-full border-2 border-emerald-500/50 p-1 shadow-lg shadow-black/50 backdrop-blur-xs">
        {/* Radar Concentric Rings */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 m-2"></div>
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 m-6"></div>
        <div className="absolute inset-0 rounded-full border border-emerald-500/10 m-10"></div>

        {/* Crosshair Axes */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/25"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-500/25"></div>

        {/* Center player indicator (Bunker turret) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>

        {/* Radar Blips */}
        {blips.map((blip) => {
          // Normalize distance to radar radius
          const r = Math.min(radarRadius, (blip.distance / maxRadarDist) * radarRadius);
          // Angle relative to current turret view (so forward is straight UP on radar)
          const rad = blip.angleRel - Math.PI / 2;
          const bx = 64 + Math.cos(rad) * r;
          const by = 64 + Math.sin(rad) * r;

          let blipColor = 'bg-red-500';
          let shapeClass = 'w-1.5 h-1.5 rounded-full';
          let label = '';

          if (blip.type === 'helicopter') {
            blipColor = 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]';
            shapeClass = 'w-2 h-2 rotate-45';
            label = '▲';
          } else if (blip.type === 'tank') {
            blipColor = 'bg-red-600 shadow-[0_0_6px_#ef4444]';
            shapeClass = 'w-2.5 h-2.5 rounded-xs';
            label = '■';
          } else if (blip.type === 'paratrooper') {
            blipColor = 'bg-yellow-400 shadow-[0_0_6px_#facc15]';
            shapeClass = 'w-1.5 h-1.5 rounded-full animate-pulse';
            label = '●';
          }

          return (
            <div
              key={blip.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${shapeClass} ${blipColor} flex items-center justify-center text-[7px] text-black font-bold`}
              style={{ left: `${bx}px`, top: `${by}px` }}
              title={`${blip.type} - ${Math.round(blip.distance)}m`}
            />
          );
        })}

        {/* Radar Label */}
        <div className="absolute bottom-1 right-2 text-[8px] font-mono text-emerald-400/80 tracking-tighter">
          TGT: {blips.length}
        </div>
      </div>
    </div>
  );
};
