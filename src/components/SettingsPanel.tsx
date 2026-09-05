import React from 'react';
import { X, Globe } from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../i18n';

export interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
  onSelectLanguage: (v: Language) => void;
  autoFire: 'off' | 'on' | 'smart';
  aimAssist: boolean;
  haptics: boolean;
  invertY: boolean;
  gyroSensitivity: number;
  reducedMotion: boolean;
  graphics: 'low' | 'medium' | 'high';
  controlScheme: 'touch' | 'gyro' | 'hybrid';
  onAutoFire: (v: 'off' | 'on' | 'smart') => void;
  onAimAssist: (v: boolean) => void;
  onHaptics: (v: boolean) => void;
  onInvertY: (v: boolean) => void;
  onGyroSensitivity: (v: number) => void;
  onReducedMotion: (v: boolean) => void;
  onGraphics: (v: 'low' | 'medium' | 'high') => void;
  onControlScheme: (v: 'touch' | 'gyro' | 'hybrid') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  onClose,
  lang,
  onSelectLanguage,
  autoFire,
  aimAssist,
  haptics,
  invertY,
  gyroSensitivity,
  reducedMotion,
  graphics,
  controlScheme,
  onAutoFire,
  onAimAssist,
  onHaptics,
  onInvertY,
  onGyroSensitivity,
  onReducedMotion,
  onGraphics,
  onControlScheme,
}) => {
  if (!open) return null;

  const t = I18N[lang];
  const isRtl = lang === 'ku';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border-2 border-amber-600/80 rounded-md p-3.5 sm:p-5 w-full max-w-lg max-h-[92vh] overflow-y-auto text-white shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <h2 className="text-base sm:text-lg font-mono font-bold tracking-wider text-amber-400 uppercase">
            {t.settings}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded cursor-pointer" aria-label="Close">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs sm:text-sm">
          {/* Language Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1 font-bold">
              <Globe className="w-3 h-3 text-amber-400" /> {t.language}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectLanguage('en')}
                className={`flex-1 py-1 rounded border text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onSelectLanguage('ku')}
                className={`flex-1 py-1 rounded border text-xs font-bold transition-all cursor-pointer ${
                  lang === 'ku'
                    ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                کوردی (سۆرانی)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Graphics Quality */}
            <div>
              <label className="block text-zinc-400 text-[11px] mb-1 font-bold">{t.graphicsQuality}</label>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onGraphics(v)}
                    className={`flex-1 py-1 rounded border text-[11px] uppercase cursor-pointer ${
                      graphics === v
                        ? 'bg-amber-700 border-amber-400 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {v === 'low' ? t.low : v === 'high' ? t.high : t.med}
                  </button>
                ))}
              </div>
            </div>

            {/* Aim Control (Mobile) */}
            <div>
              <label className="block text-zinc-400 text-[11px] mb-1 font-bold">{t.aimControl}</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onControlScheme('touch')}
                  className={`flex-1 py-1 rounded border text-[11px] uppercase cursor-pointer ${
                    controlScheme === 'touch'
                      ? 'bg-emerald-700 border-emerald-400 text-white font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.drag}
                </button>
                <button
                  onClick={() => onControlScheme('gyro')}
                  className={`flex-1 py-1 rounded border text-[11px] uppercase cursor-pointer ${
                    controlScheme === 'gyro'
                      ? 'bg-emerald-700 border-emerald-400 text-white font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.gyro}
                </button>
                <button
                  onClick={() => onControlScheme('hybrid')}
                  className={`flex-1 py-1 rounded border text-[11px] uppercase cursor-pointer ${
                    controlScheme === 'hybrid'
                      ? 'bg-emerald-700 border-emerald-400 text-white font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.both}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Auto-Fire */}
            <div>
              <label className="block text-zinc-400 text-[11px] mb-1 font-bold">{t.autoFire}</label>
              <div className="flex gap-1.5">
                {(['off', 'on', 'smart'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => onAutoFire(v)}
                    className={`flex-1 py-1 rounded border text-[11px] uppercase cursor-pointer ${
                      autoFire === v
                        ? 'bg-emerald-700 border-emerald-400 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t[v]}
                  </button>
                ))}
              </div>
            </div>

            {/* Gyro Slider */}
            <div>
              <label className="block text-zinc-400 text-[11px] mb-1 font-bold">
                {t.gyroSensitivity}: {gyroSensitivity.toFixed(1)}x
              </label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={gyroSensitivity}
                onChange={(e) => onGyroSensitivity(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Toggles Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
            <Toggle label={t.aimAssist} value={aimAssist} onChange={onAimAssist} />
            <Toggle label={t.haptics} value={haptics} onChange={onHaptics} />
            <Toggle label={t.invertY} value={invertY} onChange={onInvertY} />
            <Toggle label={t.reducedMotion} value={reducedMotion} onChange={onReducedMotion} />
          </div>
        </div>
      </div>
    </div>
  );
};

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between px-2 py-1 rounded border cursor-pointer ${
        value
          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span className="text-[10px] font-bold">{label}</span>
      <span className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-zinc-600'}`} />
    </button>
  );
}
