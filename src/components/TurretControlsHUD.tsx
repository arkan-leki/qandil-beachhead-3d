import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Plane, Crosshair } from 'lucide-react';
import { GameStats, Language, RadarBlip, WeaponState, WeaponType } from '../types';
import { RadarHUD } from './RadarHUD';
import { I18N } from '../i18n';

interface TurretControlsHUDProps {
  stats: GameStats;
  weapons: Record<WeaponType, WeaponState>;
  currentWeapon: WeaponType;
  radarBlips: RadarBlip[];
  headingDeg: number;
  pitchDeg?: number;
  zoomLevel: number;
  isMuted: boolean;
  isNight: boolean;
  autoFire: boolean;
  lang?: Language;
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
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  kamikazeReady?: boolean;
  onKamikaze?: () => void;
  supplyNotice?: { text: string; color: 'emerald' | 'gold'; key: number } | null;
  isGodMode?: boolean;
  isInfiniteAmmo?: boolean;
  onOpenCheats?: () => void;
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
  radarBlips,
  headingDeg,
  pitchDeg,
  onSwitchWeapon,
  onReload,
  onToggleZoom,
  onToggleMute,
  onFireStart,
  onFireEnd,
  onAirstrike,
  onFlare,
  onSettings,
  onFullscreen,
  isFullscreen,
  kamikazeReady,
  onKamikaze,
  supplyNotice,
  isGodMode,
  isInfiniteAmmo,
  onOpenCheats,
  lang = 'en',
}) => {
  const t = I18N[lang];
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
      {/* ---- Split-zone hints (touch only): LEFT = aim ---- */}
      {isTouch && (
        <div className="absolute inset-x-0 bottom-44 sm:bottom-48 flex justify-between px-3 pointer-events-none">
          <div className="font-mono text-[9px] sm:text-[10px] text-emerald-300/80 bg-black/50 px-2 py-0.5 rounded border border-emerald-500/30 tracking-widest">{t.dragAimHint}</div>
        </div>
      )}

      {/* ---- Wave banner (transient) ---- */}
      {banner && (
        <div key={banner.key} className="absolute top-[16%] inset-x-0 flex justify-center pointer-events-none">
          <div className={`px-8 py-3 rounded-sm border text-center ${
            banner.night ? 'bg-indigo-950/80 border-indigo-500/70' : 'bg-black/75 border-amber-600/60'
          }`} style={{ animation: 'waveIn 0.4s ease-out, fadeUp 2.2s ease-in 0.4s forwards' }}>
            <div className="font-mono text-3xl font-black tracking-widest text-amber-400">{t.waveBannerTitle(banner.wave)}</div>
            {banner.night && <div className="font-mono text-[11px] tracking-widest text-indigo-300">{t.nightMissionBanner}</div>}
          </div>
        </div>
      )}

      {/* ---- Supply Drop banner (transient) ---- */}
      {supplyNotice && (
        <div key={supplyNotice.key} className="absolute top-[24%] inset-x-0 flex justify-center pointer-events-none z-30 px-4">
          <div className={`px-5 py-2 rounded-sm border text-center shadow-lg backdrop-blur-xs flex items-center gap-2.5 ${
            supplyNotice.color === 'emerald'
              ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-emerald-950/60'
              : 'bg-amber-950/90 border-amber-400/80 text-amber-300 shadow-amber-950/60'
          }`} style={{ animation: 'waveIn 0.3s ease-out, fadeUp 2.6s ease-in 0.3s forwards' }}>
            <span className="text-xl">🪂</span>
            <div className="font-mono text-xs sm:text-sm font-black tracking-wider">
              {supplyNotice.text.includes('AIRDROP')
                ? t.airdropInboundNotice
                : supplyNotice.text.includes('MUNITIONS') || supplyNotice.text.includes('REPAIRS')
                ? t.munitionsReceivedNotice
                : supplyNotice.text}
            </div>
          </div>
        </div>
      )}

      {/* ---- Top row: score (left) · 360 radar/compass (centre) · buttons (right) ---- */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Top-LEFT: score + wave detail cluster */}
        <div className="flex flex-col gap-1.5 items-start">
          <div className="flex items-stretch gap-1.5 pointer-events-auto">
            {/* Score */}
            <div className="bg-black/60 backdrop-blur-[2px] border border-zinc-700/50 rounded px-2.5 py-1 text-right">
              <div className="text-[8px] font-mono text-zinc-500 tracking-[0.2em]">{t.score}</div>
              <div className="font-mono text-lg sm:text-xl font-bold text-amber-400 leading-none">{stats.score.toLocaleString()}</div>
            </div>
            {/* Wave */}
            <div className="bg-black/60 backdrop-blur-[2px] border border-zinc-700/50 rounded px-2 py-1 text-center">
              <div className="text-[8px] font-mono text-zinc-500 tracking-[0.2em]">{t.wave}</div>
              <div className="font-mono text-lg sm:text-xl font-bold text-emerald-400 leading-none">{stats.wave}</div>
            </div>
            {/* Echelon */}
            <div className="bg-black/60 backdrop-blur-[2px] border border-zinc-700/50 rounded px-2 py-1 text-center">
              <div className="text-[8px] font-mono text-zinc-500 tracking-[0.2em]">{t.ech}</div>
              <div className="font-mono text-lg sm:text-xl font-bold text-cyan-400 leading-none">{stats.currentEchelon ?? 1}</div>
            </div>
          </div>

          {isCritical && (
            <div className="bg-red-950/80 border border-red-600 rounded px-2 py-1 font-mono text-[10px] text-red-300 font-bold tracking-widest animate-pulse pointer-events-none">
              ⚠ {Math.round(hpPercent)}%
            </div>
          )}

          {/* 360° compass + enemy radar (bottom-left corner) */}
          <div className="scale-75 sm:scale-90 origin-top-left">
            <RadarHUD blips={radarBlips} headingDeg={headingDeg} pitchDeg={pitchDeg} lang={lang} />
          </div>
        </div>

        {/* Top-right: utility action buttons */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-1.5">
            <button
              onClick={onFlare}
              className={`w-9 h-9 rounded flex items-center justify-center border text-base transition-all ${
                isNight
                  ? 'border-amber-400 bg-amber-950/90 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
                  : 'border-amber-600/60 bg-zinc-900/80 text-amber-400 hover:bg-zinc-800'
              }`}
              title={t.flareTitle}
            >
              🔥
            </button>
            <button
              onClick={onToggleMute}
              className="w-9 h-9 rounded flex items-center justify-center border border-zinc-700 bg-black/60"
              title={isMuted ? t.unmuteTitle : t.muteTitle}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onFullscreen}
              className="w-9 h-9 rounded flex items-center justify-center border border-zinc-700 bg-black/60 text-zinc-200"
              title={isFullscreen ? t.exitFullscreenTitle : t.fullscreenTitle}
            >
              {isFullscreen ? '🡼' : '⛶'}
            </button>
            <button
              onClick={onSettings}
              className="w-9 h-9 rounded flex items-center justify-center border border-zinc-700 bg-black/60 text-lg"
              title={t.settingsTitle}
            >
              ⚙️
            </button>
            {onOpenCheats && (
              <button
                onClick={onOpenCheats}
                className="w-9 h-9 rounded flex items-center justify-center border border-emerald-500/70 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/80 font-mono font-black text-xs transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                title={lang === 'zh' ? '秘籍终端 (~ / F9)' : 'Cheat Console (~ / F9)'}
              >
                {lang === 'zh' ? '秘' : '⚡'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-1 pointer-events-none">
            {isGodMode && (
              <div className="bg-amber-950/90 border border-amber-500/80 rounded px-1.5 py-0.5 font-mono text-[9px] text-amber-300 font-bold tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse">
                {lang === 'zh' ? '无敌模式' : 'GOD MODE'}
              </div>
            )}
            {isInfiniteAmmo && (
              <div className="bg-emerald-950/90 border border-emerald-500/80 rounded px-1.5 py-0.5 font-mono text-[9px] text-emerald-300 font-bold tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
                {lang === 'zh' ? '无限弹药' : 'INF AMMO'}
              </div>
            )}
            {autoFire && (
              <div className="bg-cyan-950/80 border border-cyan-600/70 rounded px-1.5 py-0.5 font-mono text-[9px] text-cyan-300 font-bold tracking-widest">
                {t.autoFire}
              </div>
            )}
          </div>
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
            {t.weaponNames[currentWeapon]?.short || WEAPON_LIST.find((w) => w.type === currentWeapon)?.short}
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
            <span className="font-bold text-white tracking-wider">
              {t.weaponNames[currentWeapon]?.short || WEAPON_LIST.find((w) => w.type === currentWeapon)?.short}
            </span>
            <span className="text-zinc-400">
              {activeW.reloading ? t.reloading : activeW.unlimited && currentWeapon !== 'handgun' ? t.inf : `${activeW.ammo}`}
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
            {(activeW.overheated) && <span className="text-red-400 font-bold animate-pulse">{t.overheat}</span>}
            {activeW.reloading ? null : (
              <button onClick={() => onReload(currentWeapon)} className="text-zinc-400 hover:text-white px-1 cursor-pointer" title={t.reloading}>↻</button>
            )}
          </div>

          {/* HOLD-TO-OPEN weapon wheel (GTA style) */}
          <button
            onPointerDown={(e) => openWheel(e)}
            onPointerMove={(e) => moveWheel(e)}
            onPointerUp={(e) => closeWheel(e)}
            onPointerLeave={() => closeWheel()}
            onPointerCancel={() => closeWheel()}
            className="pointer-events-auto relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-900/85 border-2 border-amber-500/80 shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform font-mono font-bold text-[10px] cursor-pointer"
            title={lang === 'ku' ? 'ڕاگرە بۆ هەڵبژاردنی چەک (١-٥ لە کیبۆرد)' : 'Hold to switch weapon (1-5 on keyboard)'}
          >
            <div className="flex flex-col items-center leading-none gap-0.5">
              <span className="text-2xl">🔫</span>
              <span>{t.guns}</span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
          </button>
          <div className="font-mono text-[8px] text-zinc-500 tracking-widest pointer-events-none">
            {t.tapFireHoldGuns}
          </div>
        </div>

        {/* PUBG-Style Combat Control Cluster in the Bottom-Right Corner */}
        <div className="pointer-events-auto flex items-end gap-2 sm:gap-3 select-none">
          {/* Tactical Support Column: Air Attack (Airstrike) & Kamikaze Drone */}
          <div className="flex flex-col items-center gap-2">
            {/* Air Attack (Airstrike) Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAirstrike && airstrikesAvailable > 0) {
                  onAirstrike();
                  if (navigator.vibrate) navigator.vibrate(250);
                }
              }}
              disabled={airstrikesAvailable <= 0}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                airstrikesAvailable > 0
                  ? 'bg-linear-to-b from-red-950 via-red-900 to-zinc-950 border-2 border-red-500/90 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-92 active:border-red-400'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
              title={t.airstrikeTitle(airstrikesAvailable)}
            >
              <Plane className={`w-4 h-4 sm:w-5 sm:h-5 -rotate-45 ${airstrikesAvailable > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-600'}`} />
              <span className="font-mono text-[7px] sm:text-[8px] font-black tracking-wider leading-none mt-0.5">
                {t.airAttack}
              </span>
              {/* Badge: remaining strikes */}
              <span
                className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-mono text-[8px] sm:text-[9px] font-black border ${
                  airstrikesAvailable > 0
                    ? 'bg-red-500 text-white border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                {airstrikesAvailable}
              </span>
            </button>

            {/* Drone (Kamikaze) Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onKamikaze && kamikazeReady) {
                  onKamikaze();
                  if (navigator.vibrate) navigator.vibrate(200);
                }
              }}
              disabled={!kamikazeReady}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                kamikazeReady
                  ? 'bg-linear-to-b from-orange-950 via-amber-950 to-zinc-950 border-2 border-orange-500/90 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.5)] active:scale-92 active:border-orange-300'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
              }`}
              title={t.kamikazeTitle}
            >
              <span className="text-lg sm:text-xl leading-none">🚁</span>
              <span className="font-mono text-[7px] sm:text-[8px] font-black tracking-wider leading-none mt-0.5">
                {t.drone}
              </span>
              {/* Badge: status */}
              <span
                className={`absolute -top-1 -right-1 px-1 rounded-full flex items-center justify-center font-mono text-[7px] sm:text-[8px] font-bold border ${
                  kamikazeReady
                    ? 'bg-orange-500 text-black border-amber-300 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                {kamikazeReady ? t.ready : t.cooldown}
              </span>
            </button>
          </div>

          {/* Primary Combat Column: Scope (ADS) & Fire */}
          <div className="flex flex-col items-center gap-2">
            {/* Scope / Zoom Button (PUBG ADS Position: directly above Fire) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleZoom();
                if (navigator.vibrate) navigator.vibrate(30);
              }}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                zoomLevel > 1
                  ? 'bg-linear-to-b from-amber-950 via-yellow-950 to-zinc-950 border-2 border-amber-400 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.65)] ring-2 ring-amber-500/50 active:scale-92'
                  : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-2 border-zinc-600 text-zinc-200 active:scale-92'
              }`}
              title={t.zoomTitle(zoomLevel)}
            >
              <Crosshair className={`w-4 h-4 sm:w-5 sm:h-5 ${zoomLevel > 1 ? 'text-amber-400' : 'text-zinc-300'}`} />
              <span className="font-mono text-[7px] sm:text-[8px] font-black tracking-wider leading-none mt-0.5">
                {t.scope}
              </span>
              {/* Dynamic magnification badge */}
              <span
                className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full font-mono text-[8px] sm:text-[9px] font-black border ${
                  zoomLevel > 1
                    ? 'bg-amber-400 text-black border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                {zoomLevel > 1 ? `${zoomLevel.toFixed(0)}X` : '1X'}
              </span>
            </button>

            {/* Primary FIRE Button */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onFireStart();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onFireEnd();
              }}
              onPointerLeave={(e) => {
                e.stopPropagation();
                onFireEnd();
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onFireEnd();
              }}
              className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-linear-to-b from-red-500 via-red-600 to-red-900 border-4 border-amber-400/90 shadow-[0_0_24px_rgba(239,68,68,0.7)] flex flex-col items-center justify-center text-white active:scale-92 active:border-red-400 active:brightness-125 transition-all cursor-pointer select-none"
              title={t.fire}
            >
              <span className="text-2xl sm:text-3xl leading-none -mb-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">🔥</span>
              <span className="text-[10px] sm:text-xs font-black font-mono tracking-widest text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {t.fire}
              </span>
            </button>
          </div>
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
                  <span className="font-mono text-[9px] font-bold">{t.weaponNames[w.type]?.short || w.short}</span>
                  <span className="font-mono text-[8px] opacity-80">
                    {weapons[w.type].unlimited && w.type !== 'handgun' ? t.inf : weapons[w.type].ammo}
                  </span>
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900 border-2 border-amber-400 flex items-center justify-center font-mono text-[8px] text-amber-300 text-center leading-tight whitespace-pre-line">
              {t.wheelHoldRelease}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
