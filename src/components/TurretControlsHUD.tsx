import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ZoomIn, Plane } from 'lucide-react';
import { GameStats, RadarBlip, WeaponState, WeaponType } from '../types';

interface TurretControlsHUDProps {
  stats: GameStats;
  weapons: Record<WeaponType, WeaponState>;
  currentWeapon: WeaponType;
  radarBlips: RadarBlip[];
  headingDeg: number;
  zoomLevel: number;
  isMuted: boolean;
  isNight: boolean;
  autoFire: boolean;
  onSwitchWeapon: (type: WeaponType) => void;
  onReload: (type: WeaponType) => void;
  onToggleZoom: () => void;
  onToggleMute: () => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onAirstrike?: () => void;
  onFlare?: () => void;
  onToggleAutoFire?: () => void;
  onSettings?: () => void;
}

const WEAPON_LIST: { type: WeaponType; key: string; short: string; icon: string }[] = [
  { type: 'm60', key: '1', short: 'M60', icon: '🔫' },
  { type: 'aa_gun', key: '2', short: 'ZU-23', icon: '🎯' },
  { type: 'heavy_cannon', key: '3', short: '105MM', icon: '💥' },
  { type: 'missile', key: '4', short: 'SAM', icon: '🚀' },
  { type: 'handgun', key: '5', short: '.45', icon: '🔫' },
];

export const TurretControlsHUD: React.FC<TurretControlsHUDProps> = ({
  stats,
  weapons,
  currentWeapon,
  isMuted,
  isNight,
  autoFire,
  zoomLevel,
  onSwitchWeapon,
  onReload,
  onToggleZoom,
  onToggleMute,
  onFireStart,
  onFireEnd,
  onAirstrike,
  onFlare,
  onSettings,
}) => {
  const activeW = weapons[currentWeapon];
  const hpPercent = (stats.baseHealth / stats.maxBaseHealth) * 100;
  const isCritical = hpPercent <= 25;
  const airstrikesAvailable = stats.airstrikesAvailable ?? 0;
  // Whether the device is touch-capable (to show split-zone hints only on mobile)
  const [isTouch] = useState(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Wave banner: briefly announce the wave, then hide (no permanent header)
  const [banner, setBanner] = useState<{ wave: number; night: boolean; key: number } | null>(null);
  const prevWave = useRef(stats.wave);
  useEffect(() => {
    if (stats.wave !== prevWave.current) {
      prevWave.current = stats.wave;
      setBanner({ wave: stats.wave, night: isNight, key: Date.now() });
      const t = setTimeout(() => setBanner(null), 2600);
      return () => clearTimeout(t);
    }
  }, [stats.wave, isNight]);

  // --- GTA-style weapon wheel: HOLD the guns button to open, release over a weapon ---
  const [wheelOpen, setWheelOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const wheelHold = useRef<number | null>(null);
  const wheelAnchor = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const wheelActive = useRef(false);

  const wheelCenter = () => {
    // wheel is rendered as a big circle centered near the bottom of the screen
    return { x: window.innerWidth / 2, y: window.innerHeight * 0.62 };
  };

  const openWheel = (e: React.PointerEvent) => {
    wheelAnchor.current = { x: e.clientX, y: e.clientY };
    wheelHold.current = window.setTimeout(() => {
      setWheelOpen(true);
      wheelActive.current = true;
      // highlight nothing yet; release picks weapon under finger
      setHighlight(-1);
    }, 180);
  };

  const moveWheel = (e: React.PointerEvent) => {
    if (!wheelActive.current) return;
    const c = wheelCenter();
    const ang = Math.atan2(e.clientY - c.y, e.clientX - c.x) + Math.PI; // 0..2PI
    const n = WEAPON_LIST.length;
    // slots spread clockwise starting right
    const slot = Math.floor(((ang / (Math.PI * 2)) * n + 0.5) % n);
    setHighlight(slot);
  };

  const closeWheel = (e?: React.PointerEvent) => {
    if (wheelHold.current) { clearTimeout(wheelHold.current); wheelHold.current = null; }
    if (wheelActive.current) {
      wheelActive.current = false;
      if (e && highlight >= 0 && highlight < WEAPON_LIST.length) {
        const w = WEAPON_LIST[highlight];
        if (w.type !== currentWeapon) onSwitchWeapon(w.type);
      }
      setWheelOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between overflow-hidden"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      {/* ---- Split-zone hints (touch only): LEFT = aim, RIGHT = gun ---- */}
      {isTouch && (
        <div className="absolute inset-x-0 bottom-40 sm:bottom-44 flex justify-between px-3 pointer-events-none">
          <div className="font-mono text-[9px] sm:text-[10px] text-emerald-300/70 bg-black/40 px-2 py-0.5 rounded tracking-widest">◀ DRAG = AIM</div>
          <div className="font-mono text-[9px] sm:text-[10px] text-amber-300/70 bg-black/40 px-2 py-0.5 rounded tracking-widest">TAP = GUN ▶</div>
        </div>
      )}

      {/* ---- Wave banner (transient) ---- */}
      {banner && (
        <div key={banner.key} className="absolute top-[16%] inset-x-0 flex justify-center pointer-events-none">
          <div className={`px-8 py-3 rounded-sm border text-center ${
            banner.night ? 'bg-indigo-950/80 border-indigo-500/70' : 'bg-black/75 border-amber-600/60'
          }`} style={{ animation: 'waveIn 0.4s ease-out, fadeUp 2.2s ease-in 0.4s forwards' }}>
            <div className="font-mono text-3xl font-black tracking-widest text-amber-400">WAVE {banner.wave}</div>
            {banner.night && <div className="font-mono text-[11px] tracking-widest text-indigo-300">NIGHT MISSION — SEARCHLIGHT ACTIVE</div>}
          </div>
        </div>
      )}

      {/* ---- Top-left: compact score + night flare ---- */}
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col gap-1.5">
          <div className="bg-black/60 backdrop-blur-[2px] border border-zinc-700/50 rounded px-2.5 py-1 text-right pointer-events-auto">
            <div className="text-[9px] font-mono text-zinc-500 tracking-[0.2em]">SCORE</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-amber-400 leading-none">{stats.score.toLocaleString()}</div>
          </div>
          {isCritical && (
            <div className="bg-red-950/80 border border-red-600 rounded px-2 py-1 font-mono text-[10px] text-red-300 font-bold tracking-widest animate-pulse pointer-events-none">
              ⚠ {Math.round(hpPercent)}%
            </div>
          )}
        </div>

        {/* Top-right: minimal action buttons */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-1.5">
            <button
              onClick={onAirstrike}
              disabled={airstrikesAvailable <= 0}
              className={`w-9 h-9 rounded flex items-center justify-center border text-xs ${
                airstrikesAvailable > 0 ? 'bg-red-950/80 border-red-500/70 text-red-300 animate-pulse' : 'bg-zinc-900/60 border-zinc-800 text-zinc-600'
              }`}
              title={`Airstrike (B) — ${airstrikesAvailable} left`}
            >
              <Plane className="w-4 h-4" />
            </button>
            {isNight && (
              <button
                onClick={onFlare}
                className="w-9 h-9 rounded flex items-center justify-center border border-indigo-500/70 bg-indigo-950/80 text-lg"
                title="Flare (F)"
              >
                💡
              </button>
            )}
            <button
              onClick={onToggleZoom}
              className="w-9 h-9 rounded flex items-center justify-center border border-zinc-700 bg-black/60 text-zinc-200"
              title={`Zoom (${zoomLevel}x)`}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="w-9 h-9 rounded flex items-center justify-center border border-zinc-700 bg-black/60"
              title="Mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onSettings}
              className="w-9 h-9 rounded flex items-center justify-center border border-zinc-700 bg-black/60 text-lg"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
          {autoFire && (
            <div className="bg-emerald-950/80 border border-emerald-600/70 rounded px-1.5 py-0.5 font-mono text-[9px] text-emerald-300 font-bold tracking-widest pointer-events-none">
              AUTO-FIRE
            </div>
          )}
        </div>
      </div>

      {/* ---- Center reticle ---- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 border border-white/25 rounded-full flex items-center justify-center">
          <div className="absolute top-0 bottom-0 w-px bg-white/25"></div>
          <div className="absolute left-0 right-0 h-px bg-white/25"></div>
          <div className="w-10 h-10 border border-emerald-400/40 rounded-full"></div>
          <div className="w-2 h-2 border border-amber-400/80 rounded-full"></div>
          <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/60"></div>
          <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/60"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/60"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/60"></div>
          <div className="absolute bottom-0.5 right-1.5 text-[9px] font-mono text-amber-300 font-bold">
            {WEAPON_LIST.find((w) => w.type === currentWeapon)?.short}
          </div>
        </div>
      </div>

      {/* ---- Bottom: health bar, weapon wheel trigger, fire ---- */}
      <div className="flex items-end justify-between gap-2 w-full">
        {/* Health (compact vertical-friendly) */}
        <div className="w-16 sm:w-36 pointer-events-none flex flex-col gap-1">
          <div className="h-2 sm:h-3 w-full bg-zinc-900/80 border border-zinc-700 rounded-sm overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isCritical ? 'bg-red-600' : hpPercent < 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
          <div className={`font-mono text-[10px] sm:text-xs font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
            {Math.round(hpPercent)}%
          </div>
        </div>

        {/* Weapon wheel trigger + active weapon readout */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 bg-black/70 border border-zinc-700/60 rounded px-2 py-0.5 font-mono text-[10px] text-zinc-300">
            <span className="text-amber-400 font-bold">{WEAPON_LIST.find((w) => w.type === currentWeapon)?.icon}</span>
            <span className="font-bold text-white tracking-wider">{WEAPON_LIST.find((w) => w.type === currentWeapon)?.short}</span>
            <span className="text-zinc-400">
              {activeW.reloading ? 'RELOADING' : activeW.unlimited && currentWeapon !== 'handgun' ? 'INF' : `${activeW.ammo}`}
            </span>
            {currentWeapon === 'm60' && (
              <span className="flex items-center gap-1">
                <span className="w-10 h-1.5 bg-zinc-800 rounded overflow-hidden">
                  <span
                    className={`block h-full ${(activeW.heat ?? 0) >= 1 ? 'bg-red-500' : (activeW.heat ?? 0) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${((activeW.heat ?? 0) * 100).toFixed(0)}%` }}
                  ></span>
                </span>
              </span>
            )}
            {(activeW.overheated) && <span className="text-red-400 font-bold animate-pulse">OVERHEAT!</span>}
            {activeW.reloading ? null : (
              <button onClick={() => onReload(currentWeapon)} className="text-zinc-400 hover:text-white px-1" title="Reload (R)">↻</button>
            )}
          </div>

          {/* HOLD-TO-OPEN weapon wheel (GTA style) */}
          <button
            onPointerDown={(e) => openWheel(e)}
            onPointerMove={(e) => moveWheel(e)}
            onPointerUp={(e) => closeWheel(e)}
            onPointerLeave={() => closeWheel()}
            onPointerCancel={() => closeWheel()}
            className="pointer-events-auto relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-900/85 border-2 border-amber-500/80 shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform font-mono font-bold text-[10px]"
            title="Hold to switch weapon (1-5 on keyboard)"
          >
            <div className="flex flex-col items-center leading-none gap-0.5">
              <span className="text-2xl">🔫</span>
              <span>GUNS</span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
          </button>
          <div className="font-mono text-[8px] text-zinc-500 tracking-widest pointer-events-none">
            TAP FIRE · HOLD GUNS
          </div>
        </div>

        {/* Fire button (pointer events avoid double-firing from touch+mouse) */}
        <div className="pointer-events-auto flex flex-col items-end gap-1">
          <button
            onPointerDown={onFireStart}
            onPointerUp={onFireEnd}
            onPointerLeave={onFireEnd}
            onPointerCancel={onFireEnd}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-b from-red-600 to-red-800 border-4 border-amber-500/80 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-transform"
          >
            <span className="text-lg leading-none mb-0.5">🔥</span>
            <span className="text-[9px] font-bold font-mono tracking-wider">FIRE</span>
          </button>
        </div>
      </div>

      {/* ---- Weapon wheel overlay ---- */}
      {wheelOpen && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <div className="absolute" style={{ left: wheelCenter().x - 130, top: wheelCenter().y - 130, width: 260, height: 260 }}>
            {WEAPON_LIST.map((w, i) => {
              const ang = (i / WEAPON_LIST.length) * Math.PI * 2 - Math.PI / 2; // start top
              const r = 100;
              const x = 130 + Math.cos(ang) * r;
              const y = 130 + Math.sin(ang) * r;
              const isSel = i === highlight;
              const isCur = w.type === currentWeapon;
              return (
                <div
                  key={w.type}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                    isSel
                      ? 'bg-amber-500/90 border-white scale-110'
                      : isCur
                      ? 'bg-amber-900/80 border-amber-300'
                      : 'bg-zinc-900/85 border-zinc-600'
                  } w-20 h-20 text-center text-white`}
                  style={{ left: x, top: y }}
                >
                  <span className="text-xl leading-none">{w.icon}</span>
                  <span className="font-mono text-[9px] font-bold">{w.short}</span>
                  <span className="font-mono text-[8px] opacity-80">
                    {weapons[w.type].unlimited && w.type !== 'handgun' ? 'INF' : weapons[w.type].ammo}
                  </span>
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900 border-2 border-amber-400 flex items-center justify-center font-mono text-[8px] text-amber-300 text-center leading-tight">
              HOLD<br />RELEASE
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
