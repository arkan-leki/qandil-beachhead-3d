import React from 'react';
import { Shield, Volume2, VolumeX, Crosshair, ZoomIn, RotateCcw, Plane } from 'lucide-react';
import { GameStats, RadarBlip, WeaponState, WeaponType } from '../types';
import { RadarHUD } from './RadarHUD';

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

export const TurretControlsHUD: React.FC<TurretControlsHUDProps> = ({
  stats,
  weapons,
  currentWeapon,
  radarBlips,
  headingDeg,
  zoomLevel,
  isMuted,
  isNight,
  autoFire,
  onSwitchWeapon,
  onReload,
  onToggleZoom,
  onToggleMute,
  onFireStart,
  onFireEnd,
  onAirstrike,
  onFlare,
  onToggleAutoFire,
  onSettings,
}) => {
  const activeW = weapons[currentWeapon];
  const hpPercent = (stats.baseHealth / stats.maxBaseHealth) * 100;
  const isCritical = hpPercent <= 25;
  const airstrikesAvailable = stats.airstrikesAvailable ?? 0;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Score & Mission Status */}
        <div className="bg-black/70 backdrop-blur-xs border border-zinc-700/60 p-2.5 sm:p-3.5 rounded-sm shadow-xl flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
                QANDIL DEFENSE ZONE
              </span>
            </div>
            {stats.difficulty && (
              <span className={`text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                stats.difficulty === 'easy'
                  ? 'text-emerald-400 bg-emerald-950/70 border-emerald-700'
                  : stats.difficulty === 'hard'
                  ? 'text-red-400 bg-red-950/70 border-red-700'
                  : 'text-amber-400 bg-amber-950/70 border-amber-700'
              }`}>
                {stats.difficulty}
              </span>
            )}
            {isNight && (
              <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border text-indigo-300 bg-indigo-950/80 border-indigo-600 animate-pulse">
                NIGHT [F] FLARE
              </span>
            )}
          </div>
          <div className="flex items-baseline flex-wrap gap-2 sm:gap-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tracking-wider">
              {stats.score.toLocaleString()} <span className="text-[11px] text-zinc-400 font-normal">PTS</span>
            </div>
            <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              WAVE {stats.wave}
            </div>
            <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
              ECHELON {stats.currentEchelon ?? 1}/{stats.totalEchelons ?? 3}
            </div>
            {stats.remainingWaveEnemies !== undefined && (
              <div className="text-[11px] font-mono text-amber-400/90 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                THREATS: <b>{stats.activeThreats ?? 0} ACTIVE</b> &bull; {stats.remainingWaveEnemies} TOTAL
              </div>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono flex flex-wrap gap-x-3 gap-y-0.5">
            <span>TANKS: <b className="text-white">{stats.kills.tanks}</b></span>
            <span>APCS: <b className="text-orange-400">{stats.kills.apcs ?? 0}</b></span>
            <span>HELIS: <b className="text-cyan-400">{stats.kills.helicopters}</b></span>
            <span>AIRBORNE: <b className="text-yellow-400">{stats.kills.paratroopers}</b></span>
          </div>
        </div>

        {/* Center Radar & Compass */}
        <div className="hidden sm:flex flex-col items-center">
          <RadarHUD blips={radarBlips} headingDeg={headingDeg} />
        </div>

        {/* Top-Right Quick Controls & Sound */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tactical Airstrike Button */}
            <button
              onClick={onAirstrike}
              disabled={airstrikesAvailable <= 0}
              className={`p-2 sm:px-3 sm:py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-all border ${
                airstrikesAvailable > 0
                  ? 'bg-red-950/80 hover:bg-red-900 border-red-500 text-red-300 font-bold shadow-lg shadow-red-900/50 cursor-pointer animate-pulse'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title="Call Supersonic Jet Airstrike (Key: B)"
            >
              <Plane className="w-4 h-4 text-amber-400" />
              <span className="font-bold">[B] AIRSTRIKE ({airstrikesAvailable})</span>
            </button>

            <button
              onClick={onToggleZoom}
              className="p-2 sm:px-3 sm:py-1.5 bg-black/70 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle Optics Zoom (Z / Mouse Wheel / Right-Click)"
            >
              <ZoomIn className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline font-bold">{zoomLevel}x ZOOM</span>
            </button>

            <button
              onClick={onFlare}
              className={`p-2 sm:px-3 sm:py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border ${
                isNight ? 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500 text-indigo-200 font-bold' : 'bg-black/70 border-zinc-700 text-zinc-500'
              }`}
              title="Launch Flare (F) — illuminates the battlefield at night"
            >
              💡 <span className="hidden sm:inline font-bold">[F] FLARE</span>
            </button>

            <button
              onClick={onToggleAutoFire}
              className={`p-2 sm:px-3 sm:py-1.5 rounded text-xs font-mono flex items-center gap-1.5 transition-colors border ${
                autoFire ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold' : 'bg-black/70 border-zinc-700 text-zinc-300'
              }`}
              title="Toggle Auto-Fire (fires when crosshair is over an enemy)"
            >
              🔫 <span className="hidden sm:inline font-bold">AUTO</span>
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 bg-black/70 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-xs font-mono transition-colors cursor-pointer"
              title="Mute / Unmute Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onSettings}
              className="p-2 bg-black/70 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded text-xs font-mono transition-colors cursor-pointer"
              title="Settings"
            >
              ⚙️
            </button>
          </div>

          {/* Small screen Radar */}
          <div className="sm:hidden">
            <RadarHUD blips={radarBlips} headingDeg={headingDeg} />
          </div>
        </div>
      </div>

      {/* Center Tactical Crosshairs & Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        {/* Outer Circular Reticle */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 border border-white/25 rounded-full flex items-center justify-center">
          {/* Elevation Mil-Dots / Lead marks */}
          <div className="absolute top-0 bottom-0 w-px bg-white/30"></div>
          <div className="absolute left-0 right-0 h-px bg-white/30"></div>

          {/* Range rings */}
          <div className="w-12 h-12 border border-emerald-400/40 rounded-full"></div>
          <div className="w-2.5 h-2.5 border border-amber-400/80 rounded-full"></div>

          {/* Corner brackets for missile lock or heavy cannon */}
          <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400/70"></div>
          <div className="absolute -top-2 -right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400/70"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400/70"></div>
          <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400/70"></div>

          {/* Dynamic Aim Lead Indicator */}
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-amber-300 font-bold tracking-tighter">
            {currentWeapon === 'm60' ? 'M60' : currentWeapon === 'aa_gun' ? 'FLAK' : currentWeapon === 'heavy_cannon' ? 'HE-AP' : currentWeapon === 'missile' ? 'SAM' : '.45'}
          </div>
        </div>
      </div>

      {/* Bottom Command Dashboard */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-3 w-full">
        {/* Left: Bunker Structural Integrity */}
        <div className={`bg-black/75 backdrop-blur-xs border ${isCritical ? 'border-red-500 animate-pulse bg-red-950/30' : 'border-zinc-700/60'} p-3 rounded-sm shadow-xl min-w-[200px] sm:min-w-[260px] pointer-events-auto`}>
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
              <Shield className={`w-4 h-4 ${isCritical ? 'text-red-500' : 'text-emerald-400'}`} />
              BUNKER INTEGRITY
            </span>
            <span className={`font-mono font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
              {Math.round(hpPercent)}%
            </span>
          </div>

          <div className="w-full h-3.5 bg-zinc-900 rounded-xs border border-zinc-700 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-200 ${
                isCritical
                  ? 'bg-linear-to-r from-red-700 to-red-500'
                  : hpPercent < 60
                  ? 'bg-linear-to-r from-amber-600 to-amber-400'
                  : 'bg-linear-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
          {isCritical && (
            <div className="text-[10px] font-mono text-red-400 font-bold mt-1 text-center tracking-widest">
              WARNING: BUNKER BREACH IMMINENT
            </div>
          )}
        </div>

        {/* Center: Weapons Selector & Magazine Display */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          {/* Weapon Switch Tabs */}
          <div className="flex bg-black/80 p-1 rounded border border-zinc-700/80 gap-1 backdrop-blur-xs shadow-xl">
            {(
              [
                { type: 'm60', key: '1', short: 'M60 MG' },
                { type: 'aa_gun', key: '2', short: 'ZU-23-2 AA' },
                { type: 'heavy_cannon', key: '3', short: '105mm CANNON' },
                { type: 'missile', key: '4', short: 'MISSILES' },
                { type: 'handgun', key: '5', short: '.45 HG' },
              ] as const
            ).map((item) => {
              const w = weapons[item.type];
              const isSelected = currentWeapon === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => onSwitchWeapon(item.type)}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex flex-col items-center min-w-[85px] sm:min-w-[110px] ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-900/50'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="text-[9px] opacity-75">[{item.key}] {item.short}</span>
                  <span className="text-sm font-bold mt-0.5">
                    {w.reloading ? 'RELOADING' : w.unlimited && item.type !== 'handgun' ? 'INF' : `${w.ammo} / ${w.maxAmmo}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Weapon Detail & Reload Bar */}
          <div className="flex items-center gap-3 bg-black/70 px-3 py-1 rounded text-xs font-mono border border-zinc-800 text-zinc-300">
            <span>AMMO: <b className="text-amber-400">{activeW.unlimited && currentWeapon !== 'handgun' ? 'INF' : activeW.ammo}</b></span>
            {activeW.reloading ? (
              <span className="text-red-400 font-bold animate-pulse">RELOADING...</span>
            ) : (
              <button
                onClick={() => onReload(currentWeapon)}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700 transition-colors"
                title="Reload weapon (R)"
              >
                <RotateCcw className="w-3 h-3" /> [R] RELOAD
              </button>
            )}
            {currentWeapon === 'm60' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-400">HEAT</span>
                <div className="w-24 h-2.5 bg-zinc-900 rounded-xs border border-zinc-700 overflow-hidden">
                  <div
                    className={`h-full transition-all ${(activeW.heat ?? 0) >= 1 ? 'bg-red-500' : (activeW.heat ?? 0) > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${((activeW.heat ?? 0) * 100).toFixed(0)}%` }}
                  ></div>
                </div>
                {(activeW.overheated) && <span className="text-[10px] text-red-400 font-bold animate-pulse">OVERHEAT!</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right: Mobile Touch Trigger Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onMouseDown={onFireStart}
            onMouseUp={onFireEnd}
            onTouchStart={onFireStart}
            onTouchEnd={onFireEnd}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-red-600 to-red-800 border-4 border-amber-500/80 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-transform"
          >
            <Crosshair className="w-7 h-7 mb-0.5" />
            <span className="text-xs font-bold font-mono tracking-wider">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
