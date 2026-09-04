import React from 'react';
import { RadarBlip } from '../types';

interface RadarHUDProps {
  blips: RadarBlip[];
  headingDeg: number;
}

// 360° compass ring + enemy radar merged into ONE circular display.
// Blips sit on the ring at their bearing (relative to forward), the fixed
// marker at the centre is the player turret, and the ring shows N/E/S/W.
export const RadarHUD: React.FC<RadarHUDProps> = ({ blips, headingDeg }) => {
  const center = 66;       // px center of the circle
  const radius = 58;       // px radius of the compass ring
  const tickLen = 6;

  // Angle of heading marker relative to world N (0°), clockwise
  const headingRad = (headingDeg * Math.PI) / 180;

  // Place an enemy blip on the ring at its bearing.
  // `angleRel` is relative to the turret view; forward = straight up on the radar.
  const ringPoint = (angleRel: number) => {
    const rad = angleRel - Math.PI / 2; // -90° so forward is up
    return {
      x: center + Math.cos(rad) * radius,
      y: center + Math.sin(rad) * radius,
    };
  };

  // cardinal tick marks drawn around the ring (world-referenced, rotate with heading)
  const cardinals = ['N', 'E', 'S', 'W'].map((label, i) => {
    const a = (i * 90 * Math.PI) / 180 - Math.PI / 2 - headingRad;
    const x = center + Math.cos(a) * (radius - tickLen - 8);
    const y = center + Math.sin(a) * (radius - tickLen - 8);
    return { label, x, y, a };
  });

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Circular 360 compass + radar */}
      <div
        className="relative bg-zinc-950/75 rounded-full border-2 border-emerald-500/50 shadow-lg shadow-black/50 backdrop-blur-xs"
        style={{ width: center * 2, height: center * 2 }}
      >
        {/* Compass ring (disk with degree ticks) */}
        <div className="absolute inset-[7px] rounded-full border border-emerald-500/30"></div>
        <div className="absolute inset-[20px] rounded-full border border-emerald-500/15"></div>
        <div className="absolute inset-[33px] rounded-full border border-emerald-500/10"></div>

        {/* degree ticks around the rim */}
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i * 5 * Math.PI) / 180 - Math.PI / 2 - headingRad;
          const isCard = i % 18 === 0; // every 90°
          const rOut = radius - 1;
          const rIn = radius - (isCard ? 6 : 3);
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: center + Math.cos(a) * rIn,
                top: center + Math.sin(a) * rIn,
                width: 1.5,
                height: isCard ? 6 : 3,
                background: isCard ? 'rgba(252,211,77,0.9)' : 'rgba(228,228,231,0.4)',
                transformOrigin: `0 ${(rOut - rIn) / 2}px`,
                transform: `rotate(${(a * 180) / Math.PI + 90}deg)`,
              }}
            />
          );
        })}

        {/* Cardinal labels N/E/S/W (rotate with heading) */}
        {cardinals.map((c) => (
          <div
            key={c.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-bold"
            style={{ left: c.x, top: c.y, color: c.label === 'N' ? '#fbbf24' : 'rgba(255,255,255,0.55)', fontSize: 10 }}
          >
            {c.label}
          </div>
        ))}

        {/* Heading readout (top marker) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-amber-300 font-bold">
          {Math.round(headingDeg)}°
        </div>

        {/* Fixed forward chevron (points up = where the gun aims) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 mt-2 text-[10px] text-amber-400" style={{ textShadow: '0 0 5px rgba(251,191,36,0.8)' }}>
          ▲
        </div>

        {/* Player turret marker (centre) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]"></div>

        {/* Sweep line */}
        <div
          className="absolute top-1/2 left-1/2 origin-center w-1 h-[52px] bg-emerald-400/20"
          style={{ transform: `translate(-50%,-100%) rotate(${headingDeg}deg)` }}
        ></div>

        {/* Enemy blips on the ring */}
        {blips.map((blip) => {
          const p = ringPoint(blip.angleRel);
          let color = '#ef4444';
          let dot = 'dot';
          let label = '';

          if (blip.type === 'helicopter') { color = '#22d3ee'; dot = 'diamond'; label = '▲'; }
          else if (blip.type === 'tank') { color = '#f87171'; dot = 'square'; label = '■'; }
          else if (blip.type === 'paratrooper') { color = '#facc15'; dot = 'pulse'; label = '●'; }
          else if (blip.type === 'transport_plane') { color = '#a78bfa'; dot = 'diamond'; label = '✈'; }

          const size = dot === 'diamond' ? 9 : dot === 'square' ? 8 : dot === 'pulse' ? 7 : 7;
          const shapeStyle: React.CSSProperties = {
            left: p.x, top: p.y,
            width: size, height: size,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            borderRadius: dot === 'square' ? 2 : '50%',
            transform: dot === 'diamond' ? 'translate(-50%,-50%) rotate(45deg)' : 'translate(-50%,-50%)',
            animation: dot === 'pulse' ? 'radarPulse 1.2s ease-in-out infinite' : undefined,
          };

          return (
            <div
              key={blip.id}
              className="absolute flex items-center justify-center font-bold text-[8px] text-black"
              style={shapeStyle}
              title={`${blip.type} — ${Math.round(blip.distance)}m`}
            >
              {label}
            </div>
          );
        })}

        {/* Threat count */}
        <div className="absolute bottom-1 right-2 text-[8px] font-mono text-emerald-400/80">{blips.length} TGT</div>
      </div>
    </div>
  );
};
