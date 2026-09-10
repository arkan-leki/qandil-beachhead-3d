import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Plane, Crosshair, RotateCcw, X, Shield } from 'lucide-react';
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

  // --- Modern Tactical Armory & Quick Weapon Switcher ---
  const [armoryOpen, setArmoryOpen] = useState(false);
  const [dragHoveredIndex, setDragHoveredIndex] = useState<number>(-1);
  const holdTimerRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  const cycleNextWeapon = () => {
    const order: WeaponType[] = ['m60', 'aa_gun', 'heavy_cannon', 'missile', 'handgun'];
    const idx = order.indexOf(currentWeapon);
    const next = order[(idx + 1) % order.length];
    onSwitchWeapon(next);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleGunPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    isHoldingRef.current = false;
    setDragHoveredIndex(-1);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      isHoldingRef.current = true;
      setArmoryOpen(true);
      if (navigator.vibrate) navigator.vibrate(35);
    }, 220);
  };

  const handleGunPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isHoldingRef.current && !armoryOpen) return;
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    let foundIdx = -1;
    for (const el of elements) {
      const idxAttr = el.getAttribute('data-weapon-index');
      if (idxAttr !== null) {
        foundIdx = parseInt(idxAttr, 10);
        break;
      }
    }
    if (foundIdx !== dragHoveredIndex) {
      setDragHoveredIndex(foundIdx);
      if (foundIdx >= 0 && navigator.vibrate) navigator.vibrate(15);
    }
  };

  const handleGunPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Quick tap: cycle to next weapon immediately!
    if (!isHoldingRef.current) {
      cycleNextWeapon();
      return;
    }

    // If held and dragged over a weapon card, equip it and close armory!
    if (dragHoveredIndex >= 0 && dragHoveredIndex < WEAPON_LIST.length) {
      const targetWeapon = WEAPON_LIST[dragHoveredIndex].type;
      onSwitchWeapon(targetWeapon);
      if (navigator.vibrate) navigator.vibrate(40);
      setArmoryOpen(false);
    }
    // If held in place without dragging onto another card, keep armory open so user can inspect or tap!
    isHoldingRef.current = false;
    setDragHoveredIndex(-1);
  };

  const handleGunPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isHoldingRef.current = false;
    setDragHoveredIndex(-1);
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

      {/* ---- Bottom HUD: Left Gunbar & Right Combat Station ---- */}
      <div className="flex items-end justify-between gap-3 w-full">
        {/* Bottom-Left: Bunker Health & Weapon Command Station / Gunbar */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5 select-none">
          {/* Top row: Bunker Integrity & Active Weapon Status Readout */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Bunker Integrity / Health */}
            <div className="pointer-events-none flex flex-col gap-1 bg-black/75 backdrop-blur-xs border border-zinc-800/80 rounded-lg px-2.5 py-1 min-w-28 sm:min-w-32 shadow-lg">
              <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-mono tracking-widest text-zinc-400">
                <span>{t.bunkerIntegrity}</span>
                <span className={`font-bold ${isCritical ? 'text-red-400 animate-pulse' : hpPercent < 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {Math.round(hpPercent)}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 w-full bg-zinc-950 border border-zinc-700/80 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    isCritical ? 'bg-red-600 animate-pulse' : hpPercent < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Active Weapon Readout Card */}
            <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-xs border border-zinc-700/80 rounded-lg px-2 py-1 font-mono text-[9px] sm:text-[10px] text-zinc-300 shadow-md">
              <span className="text-amber-400 font-black">{WEAPON_LIST.find((w) => w.type === currentWeapon)?.icon}</span>
              <span className="font-bold text-white tracking-wider">
                {t.weaponNames[currentWeapon]?.short || WEAPON_LIST.find((w) => w.type === currentWeapon)?.short}
              </span>
              <span className={`font-mono ${activeW.reloading ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
                {activeW.reloading ? t.reloading : activeW.unlimited && currentWeapon !== 'handgun' ? t.inf : `${activeW.ammo}`}
              </span>
              {currentWeapon === 'm60' && (
                <div className="w-7 sm:w-9 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                  <div
                    className={`h-full transition-all ${(activeW.heat ?? 0) >= 1 ? 'bg-red-500' : (activeW.heat ?? 0) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${((activeW.heat ?? 0) * 100).toFixed(0)}%` }}
                  />
                </div>
              )}
              {activeW.overheated && <span className="text-red-400 text-[8px] font-bold animate-pulse">{t.overheat}</span>}
              {!activeW.reloading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReload(currentWeapon);
                  }}
                  className="text-zinc-400 hover:text-white px-0.5 text-xs cursor-pointer active:scale-90"
                  title={t.reloading}
                >
                  ↻
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: The Gunbar with Main GUNS Switcher Button + 1-Tap Quick Slots */}
          <div className="flex items-center gap-1.5">
            {/* Main GUN CHANGER Button (Tap: Next · Hold: Tactical Armory) */}
            <button
              type="button"
              onPointerDown={handleGunPointerDown}
              onPointerMove={handleGunPointerMove}
              onPointerUp={handleGunPointerUp}
              onPointerCancel={handleGunPointerCancel}
              className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-linear-to-b from-zinc-800 via-zinc-900 to-black border-2 border-amber-500/90 shadow-[0_0_16px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center text-white active:scale-92 active:border-amber-300 transition-transform cursor-pointer select-none"
              title={lang === 'ku' ? 'دابگرە بۆ چەکی دواتر • ڕابگرە بۆ کۆگا' : 'Tap for next weapon · Hold for Armory'}
            >
              <span className="text-base sm:text-lg leading-none">🔫</span>
              <span className="font-mono text-[7px] sm:text-[8px] font-black tracking-wider text-amber-300 leading-none mt-0.5">
                {t.guns}
              </span>
              <span className="font-mono text-[6px] text-zinc-400 leading-none mt-0.5 tracking-tighter">
                TAP/HOLD
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
            </button>

            {/* Quick Weapon Slots: 1-Tap Direct Weapon Selection */}
            <div className="flex items-center gap-1 bg-black/85 backdrop-blur-xs border border-zinc-700/80 rounded-xl px-1.5 py-1.5 shadow-lg">
              {WEAPON_LIST.map((w) => {
                const isCur = w.type === currentWeapon;
                return (
                  <button
                    key={w.type}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchWeapon(w.type);
                      if (navigator.vibrate) navigator.vibrate(25);
                    }}
                    className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer select-none ${
                      isCur
                        ? 'bg-linear-to-b from-amber-500 to-amber-600 text-black border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.65)] font-black scale-105'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 active:scale-95'
                    }`}
                    title={`${t.weaponNames[w.type]?.label || w.short} (${w.key})`}
                  >
                    <span className="text-xs sm:text-sm leading-none">{w.icon}</span>
                    <span className="font-mono text-[8px] sm:text-[9px] font-bold">
                      {t.weaponNames[w.type]?.short || w.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom-Right: Tactical Air Support & Primary Combat */}
        <div className="pointer-events-auto flex items-end gap-2 sm:gap-3 select-none">
          {/* Tactical Air Support Column: Air Attack (Airstrike) & Kamikaze Drone */}
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

            {/* Column 3: Primary Combat (Scope & Fire) */}
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

      {/* ---- Tactical Armory Overlay (Hold/Open Weapon Selector) ---- */}
      {armoryOpen && (
        <div
          className="fixed inset-0 z-50 pointer-events-auto bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-start p-4 sm:p-8"
          onClick={() => {
            setArmoryOpen(false);
            isHoldingRef.current = false;
            setDragHoveredIndex(-1);
          }}
          onPointerMove={(e) => {
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            let foundIdx = -1;
            for (const el of elements) {
              const idxAttr = el.getAttribute('data-weapon-index');
              if (idxAttr !== null) {
                foundIdx = parseInt(idxAttr, 10);
                break;
              }
            }
            if (foundIdx !== dragHoveredIndex) {
              setDragHoveredIndex(foundIdx);
              if (foundIdx >= 0 && navigator.vibrate) navigator.vibrate(15);
            }
          }}
          onPointerUp={() => {
            if (dragHoveredIndex >= 0 && dragHoveredIndex < WEAPON_LIST.length) {
              const targetWeapon = WEAPON_LIST[dragHoveredIndex].type;
              onSwitchWeapon(targetWeapon);
              if (navigator.vibrate) navigator.vibrate(40);
              setArmoryOpen(false);
              isHoldingRef.current = false;
              setDragHoveredIndex(-1);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md bg-zinc-950/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl text-amber-400">🛡️</span>
                <div>
                  <h3 className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider">
                    {t.armoryTitle}
                  </h3>
                  <p className="font-mono text-[9px] text-zinc-400">
                    {lang === 'ku' ? 'کلیک یان بەرپێدان بۆ هەڵبژاردن' : 'TAP OR DRAG-RELEASE TO EQUIP'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setArmoryOpen(false);
                  isHoldingRef.current = false;
                  setDragHoveredIndex(-1);
                }}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Weapon Cards */}
            <div className="flex flex-col gap-2">
              {WEAPON_LIST.map((w, i) => {
                const isCur = w.type === currentWeapon;
                const isDragHover = dragHoveredIndex === i;
                const wState = weapons[w.type];
                return (
                  <button
                    key={w.type}
                    type="button"
                    data-weapon-index={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchWeapon(w.type);
                      if (navigator.vibrate) navigator.vibrate(35);
                      setArmoryOpen(false);
                      isHoldingRef.current = false;
                      setDragHoveredIndex(-1);
                    }}
                    className={`relative w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer select-none text-left ${
                      isDragHover
                        ? 'bg-amber-500/25 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-[1.02]'
                        : isCur
                        ? 'bg-amber-950/40 border-amber-500/90 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border ${
                        isCur ? 'bg-amber-500/30 border-amber-400' : 'bg-black/60 border-zinc-700'
                      }`}>
                        {w.icon}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs sm:text-sm font-black text-white tracking-wide">
                            {t.weaponNames[w.type]?.label || w.short}
                          </span>
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-bold border border-zinc-700">
                            [{w.key}]
                          </span>
                        </div>
                        <span className="font-mono text-[9px] sm:text-[10px] text-zinc-400 mt-0.5">
                          {t.weaponRoles[w.type]}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="font-mono text-xs font-bold text-amber-300">
                        {wState.reloading
                          ? t.reloading
                          : wState.unlimited && w.type !== 'handgun'
                          ? t.inf
                          : `${wState.ammo} / ${wState.maxAmmo}`}
                      </div>
                      {isCur ? (
                        <span className="font-mono text-[8px] font-black px-2 py-0.5 rounded bg-amber-500 text-black border border-amber-300 tracking-wider">
                          {t.equipped}
                        </span>
                      ) : isDragHover ? (
                        <span className="font-mono text-[8px] font-black px-2 py-0.5 rounded bg-white text-black tracking-wider animate-pulse">
                          RELEASE
                        </span>
                      ) : (
                        <span className="font-mono text-[8px] text-zinc-500 tracking-wider">
                          TAP TO EQUIP
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
