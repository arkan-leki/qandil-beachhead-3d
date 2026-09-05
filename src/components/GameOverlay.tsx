import React from 'react';
import { Award, Target, Flame, Play, RotateCcw, Globe } from 'lucide-react';
import { Difficulty, GameStats, Language } from '../types';
import { I18N } from '../i18n';

interface GameOverlayProps {
  gameState: 'ready' | 'playing' | 'wave_cleared' | 'game_over';
  stats: GameStats;
  difficulty: Difficulty;
  lang: Language;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onSelectLanguage: (lang: Language) => void;
  onStartGame: () => void;
  onNextWave: () => void;
  onRestart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  gameState,
  stats,
  difficulty,
  lang,
  onSelectDifficulty,
  onSelectLanguage,
  onStartGame,
  onNextWave,
  onRestart,
}) => {
  if (gameState === 'playing') return null;

  const t = I18N[lang];
  const isRtl = lang === 'ku';
  const accuracy = stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0;
  const totalKills =
    stats.kills.soldiers +
    stats.kills.tanks +
    (stats.kills.apcs ?? 0) +
    stats.kills.helicopters +
    stats.kills.paratroopers +
    (stats.kills.jets ?? 0) +
    (stats.kills.transportPlanes ?? 0);

  const difficultyOptions: { id: Difficulty; label: string; tag: string; color: string; border: string; bg: string }[] = [
    {
      id: 'easy',
      label: t.easy,
      tag: t.easyTag,
      color: 'text-emerald-400',
      border: 'border-emerald-500/70',
      bg: 'bg-emerald-950/60',
    },
    {
      id: 'medium',
      label: t.medium,
      tag: t.mediumTag,
      color: 'text-amber-400',
      border: 'border-amber-500/70',
      bg: 'bg-amber-950/60',
    },
    {
      id: 'hard',
      label: t.hard,
      tag: t.hardTag,
      color: 'text-red-400',
      border: 'border-red-500/70',
      bg: 'bg-red-950/60',
    },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 select-none overflow-y-auto"
    >
      {/* 1. START SCREEN / MISSION BRIEFING (Ultra-Compact for Landscape Mobile) */}
      {gameState === 'ready' && (
        <div className="max-w-md sm:max-w-lg w-full max-h-[94vh] overflow-y-auto bg-zinc-950 border-2 border-amber-600/70 rounded-md p-3.5 sm:p-5 text-white shadow-2xl shadow-black relative my-auto">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-red-600 to-amber-600" />

          {/* Top bar: Outpost badge + Language Selector */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-800/80 text-red-400 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-bold">
              <Flame className="w-3 h-3 shrink-0" /> {t.mountainOutpost}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5 text-xs font-mono">
              <Globe className="w-3 h-3 text-zinc-400 ml-1 shrink-0" />
              <button
                onClick={() => onSelectLanguage('en')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onSelectLanguage('ku')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'ku' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                کوردی
              </button>
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="text-center mb-2.5 sm:mb-3.5">
            <h1 className="text-lg sm:text-2xl font-black tracking-wide font-mono text-zinc-100 uppercase leading-tight">
              {t.gameTitle}
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-zinc-400 mt-0.5">
              {t.gameSubtitle}
            </p>
          </div>

          {/* Difficulty Selector (Compact 3-Grid) */}
          <div className="mb-2.5 sm:mb-3">
            <div className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase mb-1.5">
              {t.selectDifficulty}
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {difficultyOptions.map((d) => {
                const isSelected = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelectDifficulty(d.id)}
                    className={`p-1.5 sm:p-2.5 rounded text-center font-mono transition-all border cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? `${d.bg} ${d.border} shadow-sm ring-1 ring-white/20`
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`text-[11px] sm:text-xs font-black tracking-wider ${isSelected ? d.color : 'text-zinc-300'}`}>
                      {d.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium leading-none mt-0.5">
                      {d.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Hint */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded px-2.5 py-1.5 text-[9px] sm:text-[10px] font-mono text-zinc-300 text-center mb-2.5 sm:mb-3.5 leading-snug">
            {t.controlsBrief}
          </div>

          {/* Start Button */}
          <button
            onClick={onStartGame}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-700 via-amber-600 to-red-700 hover:from-red-600 hover:to-amber-500 text-white font-mono font-bold text-xs sm:text-sm tracking-widest uppercase rounded shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRtl ? 'rotate-180' : ''}`} /> {t.startDefense}
          </button>
        </div>
      )}

      {/* 2. WAVE CLEARED SCREEN */}
      {gameState === 'wave_cleared' && (
        <div className="max-w-md w-full max-h-[94vh] overflow-y-auto bg-zinc-950 border-2 border-emerald-500/80 rounded-md p-4 sm:p-5 text-white shadow-2xl text-center my-auto">
          <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500 mx-auto flex items-center justify-center mb-2 text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold font-mono text-zinc-100 tracking-wider uppercase">
            {t.wave} {stats.wave} {t.waveRepelled}
          </h2>
          <p className="text-[11px] font-mono text-emerald-400 mt-0.5 mb-3">
            {t.allEchelonsCleared}
          </p>

          <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 border border-zinc-800 rounded p-2.5 mb-3.5 font-mono text-xs text-left">
            <div className="bg-zinc-950/60 p-2 rounded">
              <span className="text-[9px] text-zinc-400 block">{t.score}</span>
              <b className="text-amber-400 text-sm sm:text-base">{stats.score.toLocaleString()}</b>
            </div>
            <div className="bg-zinc-950/60 p-2 rounded">
              <span className="text-[9px] text-zinc-400 block">{t.kills}</span>
              <b className="text-emerald-400 text-sm sm:text-base">{totalKills}</b>
            </div>
          </div>

          <button
            onClick={onNextWave}
            className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs sm:text-sm tracking-widest uppercase rounded shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRtl ? 'rotate-180' : ''}`} /> {t.nextWave}
          </button>
        </div>
      )}

      {/* 3. RESTART / GAME OVER SCREEN (Compact for Landscape Mobile) */}
      {gameState === 'game_over' && (
        <div className="max-w-md sm:max-w-lg w-full max-h-[94vh] overflow-y-auto bg-zinc-950 border-2 border-red-600/90 rounded-md p-3.5 sm:p-5 text-white shadow-2xl text-center relative my-auto">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />

          {/* Top Bar: Alert & Language Switcher */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-red-400 font-mono text-[11px] font-bold">
              <Target className="w-3.5 h-3.5" />
              <span>{t.bunkerOverrun}</span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5 text-xs font-mono">
              <Globe className="w-3 h-3 text-zinc-400 ml-1" />
              <button
                onClick={() => onSelectLanguage('en')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold ${
                  lang === 'en' ? 'bg-amber-600 text-white' : 'text-zinc-400'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onSelectLanguage('ku')}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold ${
                  lang === 'ku' ? 'bg-amber-600 text-white' : 'text-zinc-400'
                }`}
              >
                کوردی
              </button>
            </div>
          </div>

          <p className="text-[11px] font-mono text-zinc-400 mb-2.5">
            {t.breachedOnWave} <span className="text-white font-bold">{stats.wave}</span>
          </p>

          {/* 4 Clean Metric Cards (Compact row) */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5 font-mono">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded p-1.5 sm:p-2 text-center">
              <span className="text-[9px] text-zinc-400 block tracking-tight">{t.score}</span>
              <b className="text-amber-400 text-xs sm:text-sm">{stats.score.toLocaleString()}</b>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded p-1.5 sm:p-2 text-center">
              <span className="text-[9px] text-zinc-400 block tracking-tight">{t.wave}</span>
              <b className="text-white text-xs sm:text-sm">{stats.wave}</b>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded p-1.5 sm:p-2 text-center">
              <span className="text-[9px] text-zinc-400 block tracking-tight">{t.kills}</span>
              <b className="text-red-400 text-xs sm:text-sm">{totalKills}</b>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded p-1.5 sm:p-2 text-center">
              <span className="text-[9px] text-zinc-400 block tracking-tight">{t.accuracy}</span>
              <b className="text-cyan-400 text-xs sm:text-sm">{accuracy}%</b>
            </div>
          </div>

          {/* Quick Difficulty Pills */}
          <div className="flex items-center justify-center gap-1.5 mb-3 font-mono text-[11px]">
            <span className="text-zinc-500 text-[10px]">{t.changeDifficulty}:</span>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onSelectDifficulty(d)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                  difficulty === d
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {t[d]}
              </button>
            ))}
          </div>

          {/* Redeploy Button */}
          <button
            onClick={onRestart}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white font-mono font-bold text-xs sm:text-sm tracking-widest uppercase rounded shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.redeploy}
          </button>
        </div>
      )}
    </div>
  );
};
