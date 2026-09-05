import React from 'react';
import { Shield, Award, Target, Flame, Play, RotateCcw, Crosshair, Gauge } from 'lucide-react';
import { Difficulty, GameStats } from '../types';

interface GameOverlayProps {
  gameState: 'ready' | 'playing' | 'wave_cleared' | 'game_over';
  stats: GameStats;
  difficulty: Difficulty;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onStartGame: () => void;
  onNextWave: () => void;
  onRestart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  gameState,
  stats,
  difficulty,
  onSelectDifficulty,
  onStartGame,
  onNextWave,
  onRestart,
}) => {
  if (gameState === 'playing') return null;

  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;

  const difficulties: {
    id: Difficulty;
    label: string;
    tag: string;
    color: string;
    border: string;
    bgSelected: string;
    desc: string;
    stats: string;
  }[] = [
    {
      id: 'easy',
      label: 'EASY',
      tag: 'RECON PATROL',
      color: 'text-emerald-400',
      border: 'border-emerald-600',
      bgSelected: 'bg-emerald-950/80 border-emerald-500 shadow-emerald-900/40',
      desc: 'Lower enemy counts, relaxed 3.2s spawn intervals, -25% enemy HP, and dispersed enemy aim.',
      stats: '0.7x Enemies • 5 Max Active • 4.8m Scatter • +35% Heal',
    },
    {
      id: 'medium',
      label: 'MEDIUM',
      tag: 'COMBINED ASSAULT',
      color: 'text-amber-400',
      border: 'border-amber-600',
      bgSelected: 'bg-amber-950/80 border-amber-500 shadow-amber-900/40',
      desc: 'Balanced military combat. Staggered 3-echelon assault with authentic enemy armor and ballistic accuracy.',
      stats: '1.0x Enemies • 8 Max Active • 2.2m Scatter • +25% Heal',
    },
    {
      id: 'hard',
      label: 'HARD',
      tag: 'TOTAL ONSLAUGHT',
      color: 'text-red-400',
      border: 'border-red-600',
      bgSelected: 'bg-red-950/80 border-red-500 shadow-red-900/40',
      desc: 'Massive armored invasion. High unit HP, rapid 1.8s deployment intervals, and lethal sniper accuracy.',
      stats: '1.4x Enemies • 12 Max Active • 0.7m Pinpoint • +15% Heal',
    },
  ];

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none overflow-y-auto">
      {/* 1. START SCREEN / MISSION BRIEFING */}
      {gameState === 'ready' && (
        <div className="max-w-xl w-full bg-zinc-950 border-2 border-amber-600/80 rounded-sm p-5 sm:p-7 text-white shadow-2xl shadow-black relative overflow-hidden my-auto">
          {/* Top banner accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-amber-600 via-red-600 to-amber-600"></div>

          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-400 text-xs font-mono tracking-widest uppercase font-bold mb-1.5">
              <Flame className="w-3.5 h-3.5" /> Mountain Warfare Outpost
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider font-mono text-zinc-100 uppercase">
              QANDIL BEACHHEAD <span className="text-amber-500">3D</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-0.5">
              HOLD THE MOUNTAIN PASS &bull; TACTICAL REDOUBT DEFENSE
            </p>
          </div>

          {/* Difficulty Setting Selector */}
          <div className="mb-4">
            <div className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase mb-2 flex items-center gap-1.5">
              <Gauge className="w-4 h-4" /> Select Combat Difficulty:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((d) => {
                const isSelected = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectDifficulty(d.id)}
                    className={`p-2.5 rounded text-left font-mono transition-all border cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${d.bgSelected} shadow-lg ring-1 ring-white/20`
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold tracking-wider ${isSelected ? d.color : 'text-zinc-300'}`}>
                          {d.label}
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-semibold tracking-tighter mt-0.5">
                        {d.tag}
                      </div>
                    </div>
                    <div className="text-[9px] text-zinc-400 border-t border-zinc-800/80 pt-1 mt-1.5">
                      {d.stats}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mission Intel & Echelon Spawning Info */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded text-xs font-mono text-zinc-300 space-y-2 mb-4">
            <div className="text-amber-400 font-bold tracking-wider uppercase flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Staggered Wave Echelons:
              </span>
              <span className="text-[10px] text-zinc-400 bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
                NO INSTANT SWARM DUMP
              </span>
            </div>
            <p className="leading-relaxed text-[11px] text-zinc-300">
              Hostiles advance through the canyon in <b>3 staggered echelons</b>: (1) Vanguard Scouts &amp; Airborne, (2) Armored Tanks &amp; APC Column, and (3) Heavy Gunships &amp; Air Assault.
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
              <div className="flex items-center gap-1.5 text-zinc-200">
                <span className="w-2 h-2 rounded-xs bg-red-600"></span> <b>TANKS:</b> Heavy armor &amp; 120mm shells
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <span className="w-2 h-2 rounded-xs bg-orange-500"></span> <b>APCs:</b> 8-wheel troop transports
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <span className="w-2 h-2 rounded-xs bg-cyan-400"></span> <b>HELIS:</b> Circle &amp; fire rockets
              </div>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <span className="w-2 h-2 rounded-xs bg-yellow-400"></span> <b>AIRBORNE:</b> Paratrooper drops
              </div>
            </div>
          </div>

          {/* Controls Overview */}
          <div className="border-t border-zinc-800 pt-3 mb-4 text-[11px] font-mono text-zinc-400 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
            <div className="bg-zinc-900/60 p-1.5 rounded">
              <span className="block text-zinc-200 font-bold">DRAG / MOUSE</span>
              360° Aim &amp; Pitch
            </div>
            <div className="bg-zinc-900/60 p-1.5 rounded">
              <span className="block text-zinc-200 font-bold">CLICK / SPACE</span>
              Fire Turret
            </div>
            <div className="bg-zinc-900/60 p-1.5 rounded">
              <span className="block text-zinc-200 font-bold">[1] [2] [3] KEYS</span>
              Switch Weapon
            </div>
            <div className="bg-zinc-900/60 p-1.5 rounded">
              <span className="block text-amber-400 font-bold">[B] AIRSTRIKE</span>
              Jet Bomb Run
            </div>
          </div>

          <button
            onClick={onStartGame}
            className="w-full py-3.5 bg-linear-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-amber-500 text-white font-mono font-bold text-base tracking-widest uppercase rounded shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" /> MAN THE TURRET ({difficulty.toUpperCase()})
          </button>
        </div>
      )}

      {/* 2. WAVE CLEARED SCREEN */}
      {gameState === 'wave_cleared' && (
        <div className="max-w-md w-full bg-zinc-950 border-2 border-emerald-500/80 rounded-sm p-6 sm:p-8 text-white shadow-2xl text-center my-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-950 border-2 border-emerald-500 mx-auto flex items-center justify-center mb-4 text-emerald-400">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-100 tracking-wider uppercase">
            WAVE {stats.wave} REPELLED
          </h2>
          <p className="text-xs font-mono text-emerald-400 mt-1 mb-2">
            ALL ECHELONS NEUTRALIZED &bull; DIFFICULTY: {difficulty.toUpperCase()}
          </p>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded p-4 mb-6 font-mono text-xs space-y-2 text-zinc-300">
            <div className="flex justify-between">
              <span>CURRENT SCORE:</span>
              <b className="text-amber-400">{stats.score.toLocaleString()} PTS</b>
            </div>
            <div className="flex justify-between">
              <span>TOTAL TANKS KILLED:</span>
              <b className="text-white">{stats.kills.tanks}</b>
            </div>
            <div className="flex justify-between">
              <span>APCs DESTROYED:</span>
              <b className="text-white">{stats.kills.apcs ?? 0}</b>
            </div>
            <div className="flex justify-between">
              <span>HELICOPTERS DOWNED:</span>
              <b className="text-white">{stats.kills.helicopters}</b>
            </div>
            <div className="flex justify-between">
              <span>AIRBORNE INTERCEPTED:</span>
              <b className="text-white">{stats.kills.paratroopers}</b>
            </div>
            {(stats.kills.jets ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>FIGHTER JETS DOWNED:</span>
                <b className="text-white">{stats.kills.jets}</b>
              </div>
            )}
            {(stats.kills.transportPlanes ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>TRANSPORTS DOWNED:</span>
                <b className="text-white">{stats.kills.transportPlanes}</b>
              </div>
            )}
          </div>

          <button
            onClick={onNextWave}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm tracking-widest uppercase rounded shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> COMMENCE WAVE {stats.wave + 1}
          </button>
        </div>
      )}

      {/* 3. GAME OVER SCREEN */}
      {gameState === 'game_over' && (
        <div className="max-w-lg w-full bg-zinc-950 border-2 border-red-600/90 rounded-sm p-6 sm:p-8 text-white shadow-2xl text-center relative my-auto">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600"></div>

          <div className="w-14 h-14 rounded-full bg-red-950 border-2 border-red-500 mx-auto flex items-center justify-center mb-4 text-red-400">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-red-500 tracking-wider uppercase">
            BUNKER OVERRUN
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-1 mb-4">
            MOUNTAIN REDOUBT WAS BREACHED ON WAVE {stats.wave} ({difficulty.toUpperCase()})
          </p>

          {/* Quick Difficulty Switcher on Game Over */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs font-mono text-zinc-400">CHANGE DIFFICULTY:</span>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onSelectDifficulty(d)}
                className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-bold border cursor-pointer ${
                  difficulty === d
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Combat Debriefing Breakdown */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded p-4 mb-6 font-mono text-xs space-y-2 text-left">
            <div className="text-amber-400 font-bold uppercase tracking-wider mb-2 border-b border-zinc-800 pb-1">
              Combat Performance Debrief:
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>FINAL COMBAT SCORE:</span>
              <b className="text-amber-400 text-sm">{stats.score.toLocaleString()} PTS</b>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>WAVE REACHED:</span>
              <b className="text-white">WAVE {stats.wave}</b>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>ARMORED TANKS DESTROYED:</span>
              <b className="text-red-400">{stats.kills.tanks}</b>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>ARMORED APCs DESTROYED:</span>
              <b className="text-orange-400">{stats.kills.apcs ?? 0}</b>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>ATTACK HELICOPTERS DOWNED:</span>
              <b className="text-cyan-400">{stats.kills.helicopters}</b>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>AIRBORNE PARATROOPERS INTERCEPTED:</span>
              <b className="text-yellow-400">{stats.kills.paratroopers}</b>
            </div>
            {(stats.kills.jets ?? 0) > 0 && (
              <div className="flex justify-between text-zinc-300">
                <span>FIGHTER JETS DOWNED:</span>
                <b className="text-sky-400">{stats.kills.jets}</b>
              </div>
            )}
            {(stats.kills.transportPlanes ?? 0) > 0 && (
              <div className="flex justify-between text-zinc-300">
                <span>CARGO TRANSPORTS DOWNED:</span>
                <b className="text-indigo-400">{stats.kills.transportPlanes}</b>
              </div>
            )}
            <div className="flex justify-between text-zinc-300">
              <span>INFANTRY SOLDIERS NEUTRALIZED:</span>
              <b className="text-emerald-400">{stats.kills.soldiers}</b>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>ACCURACY RATING:</span>
              <b className="text-white">{accuracy}% ({stats.shotsHit}/{stats.shotsFired})</b>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-4 bg-linear-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-mono font-bold text-sm tracking-widest uppercase rounded shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> REDEPLOY TO REDOUBT ({difficulty.toUpperCase()})
          </button>
        </div>
      )}
    </div>
  );
};
