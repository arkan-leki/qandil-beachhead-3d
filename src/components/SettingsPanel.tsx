import React from 'react';
import { X } from 'lucide-react';

export interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
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
  open, onClose, autoFire, aimAssist, haptics, invertY, gyroSensitivity, reducedMotion, graphics,
  controlScheme, onAutoFire, onAimAssist, onHaptics, onInvertY, onGyroSensitivity, onReducedMotion, onGraphics, onControlScheme,
}) => {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-950 border-2 border-amber-600/80 rounded-sm p-5 w-full max-w-md text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-mono font-bold tracking-wider text-amber-400">SETTINGS</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 font-mono text-sm">
          <div>
            <label className="block text-zinc-400 text-xs mb-1">GRAPHICS QUALITY</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => onGraphics(v)}
                  className={`px-3 py-1.5 rounded border text-xs uppercase ${
                    graphics === v ? 'bg-amber-700 border-amber-400 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-1">AIM CONTROL (MOBILE)</label>
            <div className="flex gap-2">
              <button
                onClick={() => onControlScheme('touch')}
                className={`px-3 py-1.5 rounded border text-xs uppercase ${
                  controlScheme === 'touch' ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                }`}
              >
                DRAG
              </button>
              <button
                onClick={() => onControlScheme('gyro')}
                className={`px-3 py-1.5 rounded border text-xs uppercase ${
                  controlScheme === 'gyro' ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                }`}
              >
                GYRO
              </button>
              <button
                onClick={() => onControlScheme('hybrid')}
                className={`px-3 py-1.5 rounded border text-xs uppercase ${
                  controlScheme === 'hybrid' ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                }`}
              >
                BOTH
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">DRAG is recommended — gyro can feel wobbly.</p>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-1">AUTO-FIRE</label>
            <div className="flex gap-2">
              {(['off', 'on', 'smart'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => onAutoFire(v)}
                  className={`px-3 py-1.5 rounded border text-xs uppercase ${
                    autoFire === v ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-1">GYRO SENSITIVITY: {gyroSensitivity.toFixed(1)}x</label>
            <input
              type="range" min={0.5} max={2.0} step={0.1} value={gyroSensitivity}
              onChange={(e) => onGyroSensitivity(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Toggle label="AIM ASSIST" value={aimAssist} onChange={onAimAssist} />
            <Toggle label="HAPTICS" value={haptics} onChange={onHaptics} />
            <Toggle label="INVERT Y" value={invertY} onChange={onInvertY} />
            <Toggle label="REDUCED MOTION" value={reducedMotion} onChange={onReducedMotion} />
          </div>

          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Gyro: tilt device to aim · tap = fire · swipe = switch weapon · swipe up = reload · pinch = zoom · two-finger tap = airstrike
          </p>
        </div>
      </div>
    </div>
  );
};

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between px-3 py-2 rounded border ${
        value ? 'bg-emerald-900/50 border-emerald-600 text-emerald-300' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
      }`}
    >
      <span>{label}</span>
      <span className={`w-2.5 h-2.5 rounded-full ${value ? 'bg-emerald-400' : 'bg-zinc-600'}`}></span>
    </button>
  );
}
