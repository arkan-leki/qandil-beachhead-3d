import React from 'react';
import { RadarBlip } from '../types';

interface RadarHUDProps {
  blips: RadarBlip[];
  headingDeg: number;
  pitchDeg?: number;
}

const getCardinal = (deg: number): string => {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[index];
};

export const RadarHUD: React.FC<RadarHUDProps> = ({ blips, headingDeg, pitchDeg }) => {
  const size = 152;
  const cx = size / 2; // 76
  const cy = size / 2; // 76
  const maxRadius = 66;

  // Horizontal camera FOV angle cone (70° total, ±35° from 12 o'clock aim axis)
  const fovHalfDeg = 35;
  const fovHalfRad = (fovHalfDeg * Math.PI) / 180;

  // Geometry of the FOV Angle Cone (📐 Vision Cone)
  const coneRadius = 65;
  const leftX = cx - Math.sin(fovHalfRad) * coneRadius;
  const leftY = cy - Math.cos(fovHalfRad) * coneRadius;
  const rightX = cx + Math.sin(fovHalfRad) * coneRadius;
  const rightY = cy - Math.cos(fovHalfRad) * coneRadius;

  // Intermediate angle tick coordinates for protractor 📐 markings
  const midLeftX = cx - Math.sin(fovHalfRad * 0.5) * coneRadius;
  const midLeftY = cy - Math.cos(fovHalfRad * 0.5) * coneRadius;
  const midRightX = cx + Math.sin(fovHalfRad * 0.5) * coneRadius;
  const midRightY = cy - Math.cos(fovHalfRad * 0.5) * coneRadius;

  // World cardinals that rotate around the rim based on current heading
  const cardinals: { label: string; deg: number; isMajor: boolean }[] = [
    { label: 'N', deg: 0, isMajor: true },
    { label: 'NE', deg: 45, isMajor: false },
    { label: 'E', deg: 90, isMajor: true },
    { label: 'SE', deg: 135, isMajor: false },
    { label: 'S', deg: 180, isMajor: true },
    { label: 'SW', deg: 225, isMajor: false },
    { label: 'W', deg: 270, isMajor: true },
    { label: 'NW', deg: 315, isMajor: false },
  ];

  // Count how many contacts are inside the active FOV view cone
  const inViewCount = blips.filter((b) => Math.abs(b.angleRel) <= fovHalfRad).length;

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Top Bearing & Pitch Angle Strip */}
      <div className="flex items-center justify-between w-[152px] px-1 pb-1 text-[9px] font-mono font-bold tracking-wider text-emerald-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        <span className="flex items-center gap-1 text-amber-300">
          <span className="text-[10px]">📐</span>
          <span>{Math.round(headingDeg).toString().padStart(3, '0')}° {getCardinal(headingDeg)}</span>
        </span>
        {pitchDeg !== undefined && (
          <span className="text-zinc-400">
            EL: <span className={pitchDeg > 0 ? 'text-cyan-300' : 'text-zinc-300'}>{pitchDeg >= 0 ? `+${pitchDeg}°` : `${pitchDeg}°`}</span>
          </span>
        )}
      </div>

      {/* Main Tactical Radar Bezel */}
      <div
        className="relative bg-zinc-950/85 rounded-full border-2 border-emerald-500/50 shadow-2xl shadow-black/80 backdrop-blur-xs overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* SVG Tactical Reticle, Range Rings & FOV Angle Cone 📐 */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          <defs>
            {/* FOV Vision Cone Glowing Gradient */}
            <radialGradient id="fovAngleGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.04" />
            </radialGradient>

            {/* Sweep beam gradient */}
            <linearGradient id="sweepBeamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Range rings (real distance: 50m, 100m, 150m, 200m) */}
          <circle cx={cx} cy={cy} r={16.5} fill="none" stroke="#10b981" strokeOpacity="0.2" strokeDasharray="2 3" />
          <circle cx={cx} cy={cy} r={33} fill="none" stroke="#10b981" strokeOpacity="0.2" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={49.5} fill="none" stroke="#10b981" strokeOpacity="0.2" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={maxRadius} fill="none" stroke="#10b981" strokeOpacity="0.4" />

          {/* Range ring labels along bottom vertical axis */}
          <text x={cx + 2} y={cy + 15} fill="#10b981" fillOpacity="0.45" fontSize="6.5" fontFamily="monospace">50m</text>
          <text x={cx + 2} y={cy + 31} fill="#10b981" fillOpacity="0.45" fontSize="6.5" fontFamily="monospace">100m</text>
          <text x={cx + 2} y={cy + 48} fill="#10b981" fillOpacity="0.45" fontSize="6.5" fontFamily="monospace">150m</text>

          {/* Crosshair coordinate axes (subtle reference grid) */}
          <line x1={cx} y1={10} x2={cx} y2={size - 10} stroke="#10b981" strokeOpacity="0.18" />
          <line x1={10} y1={cy} x2={size - 10} y2={cy} stroke="#10b981" strokeOpacity="0.18" />

          {/* ================= FOV ANGLE CONE 📐 ================= */}
          {/* Shaded illuminated vision sector representing exact camera viewport angle */}
          <path
            d={`M ${cx} ${cy} L ${leftX.toFixed(1)} ${leftY.toFixed(1)} A ${coneRadius} ${coneRadius} 0 0 1 ${rightX.toFixed(1)} ${rightY.toFixed(1)} Z`}
            fill="url(#fovAngleGlow)"
          />

          {/* Angle boundary lines (Left -35°, Right +35°) */}
          <line
            x1={cx}
            y1={cy}
            x2={leftX}
            y2={leftY}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />
          <line
            x1={cx}
            y1={cy}
            x2={rightX}
            y2={rightY}
            stroke="#34d399"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />

          {/* Intermediate protractor angle guides inside the cone */}
          <line
            x1={cx}
            y1={cy}
            x2={midLeftX}
            y2={midLeftY}
            stroke="#10b981"
            strokeWidth="0.75"
            strokeOpacity="0.35"
            strokeDasharray="2 2"
          />
          <line
            x1={cx}
            y1={cy}
            x2={midRightX}
            y2={midRightY}
            stroke="#10b981"
            strokeWidth="0.75"
            strokeOpacity="0.35"
            strokeDasharray="2 2"
          />

          {/* Boresight centerline (0° crosshair forward aim) */}
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - coneRadius}
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            strokeDasharray="2 2"
          />

          {/* Angle ticks & degree text labels on arc */}
          <text
            x={leftX - 3}
            y={leftY - 2}
            fill="#34d399"
            fontSize="6.5"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="end"
          >
            -35°
          </text>
          <text
            x={rightX + 3}
            y={rightY - 2}
            fill="#34d399"
            fontSize="6.5"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="start"
          >
            +35°
          </text>
        </svg>

        {/* Continuous 360° radar sweep animation (phosphor trail) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ animation: 'radarBeam 3.6s linear infinite', transformOrigin: `${cx}px ${cy}px` }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-[76px] bg-gradient-to-t from-transparent via-emerald-400/40 to-emerald-400"
            style={{ transformOrigin: 'bottom center' }}
          />
        </div>

        {/* Rotating Compass Cardinals (N, E, S, W rotate based on turret heading) */}
        {cardinals.map((c) => {
          const relRad = ((c.deg - headingDeg) * Math.PI) / 180;
          const cardDist = 58;
          const cardX = cx + Math.sin(relRad) * cardDist;
          const cardY = cy - Math.cos(relRad) * cardDist;
          return (
            <div
              key={c.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 font-mono font-bold leading-none pointer-events-none"
              style={{
                left: cardX,
                top: cardY,
                fontSize: c.isMajor ? 9 : 7,
                color: c.label === 'N' ? '#fbbf24' : c.isMajor ? 'rgba(255,255,255,0.7)' : 'rgba(161,161,170,0.4)',
                textShadow: c.label === 'N' ? '0 0 4px rgba(251,191,36,0.7)' : undefined,
              }}
            >
              {c.label}
            </div>
          );
        })}

        {/* Center bunker / turret indicator */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24] border border-black/60 z-10"
          title="Player Turret Redoubt"
        />

        {/* Top 12 o'clock Crosshair Boresight Aim Chevron */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-amber-400 font-bold leading-none z-10"
          style={{ textShadow: '0 0 6px rgba(251,191,36,0.9)' }}
          title="Sightline: Where your crosshair is aimed"
        >
          ▲
        </div>

        {/* Angle Badge inside the cone */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[7.5px] font-mono font-bold text-emerald-300/80 tracking-tight z-10">
          📐 70° FOV
        </div>

        {/* Enemy & Supply Drop Blips plotted by TRUE distance & relative angle */}
        {blips.map((blip) => {
          // Normalize distance: 0m to 200m maps to radius 9px to 62px
          const maxDist = 200;
          const clampedDist = Math.max(8, Math.min(maxDist, blip.distance));
          const distRatio = clampedDist / maxDist;
          const blipR = 9 + distRatio * 53;

          // 0 angleRel is straight ahead (up). Positive is clockwise (right).
          const bx = cx + Math.sin(blip.angleRel) * blipR;
          const by = cy - Math.cos(blip.angleRel) * blipR;

          // Check if contact is inside the illuminated FOV angle cone (on screen)
          const inFOV = Math.abs(blip.angleRel) <= fovHalfRad;

          let color = '#ef4444';
          let symbol = '●';
          let shapeClass = 'rounded-full';

          if (blip.type === 'supply_drop') {
            color = '#10b981';
            symbol = '✚';
            shapeClass = 'rounded-xs';
          } else if (blip.type === 'tank') {
            color = '#f87171';
            symbol = '■';
            shapeClass = 'rounded-none';
          } else if (blip.type === 'helicopter') {
            color = '#22d3ee';
            symbol = '▲';
            shapeClass = 'rounded-none';
          } else if (blip.type === 'jet') {
            color = '#fb923c';
            symbol = '✈';
            shapeClass = 'rounded-none';
          } else if (blip.type === 'transport_plane') {
            color = '#c084fc';
            symbol = '✈';
            shapeClass = 'rounded-none';
          } else if (blip.type === 'paratrooper') {
            color = '#facc15';
            symbol = '●';
            shapeClass = 'rounded-full';
          }

          return (
            <div
              key={blip.id}
              className={`absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ${
                inFOV ? 'z-20 scale-110' : 'z-10 opacity-80'
              }`}
              style={{ left: bx, top: by }}
              title={`${blip.type.toUpperCase()} [${Math.round(blip.distance)}m] ${inFOV ? '(IN VIEW)' : ''}`}
            >
              {/* In-view active targeting reticle box */}
              {inFOV && (
                <div
                  className="absolute w-4 h-4 border border-amber-400/80 rounded-xs pointer-events-none animate-pulse"
                  style={{ boxShadow: '0 0 5px rgba(251,191,36,0.6)' }}
                />
              )}

              {/* Blip marker */}
              <div
                className={`w-2.5 h-2.5 flex items-center justify-center font-bold text-[7px] text-black ${shapeClass}`}
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              >
                {symbol}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Status Bar: In-View Count & Threat Total */}
      <div className="flex items-center justify-between w-[152px] px-1 pt-1 text-[8px] font-mono text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-emerald-400 font-bold">{inViewCount} IN VIEW</span>
        </span>
        <span className="text-zinc-500 font-bold">{blips.length} TGT [200M]</span>
      </div>
    </div>
  );
};
