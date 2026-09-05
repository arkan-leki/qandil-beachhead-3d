/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useState } from 'react';
import { soundManager } from './audio/soundManager';
import { GameEngine } from './game3d/gameEngine';
import { GameOverlay } from './components/GameOverlay';
import { TurretControlsHUD } from './components/TurretControlsHUD';
import { SettingsPanel } from './components/SettingsPanel';
import { Difficulty, GameStats, RadarBlip, WeaponState, WeaponType } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'wave_cleared' | 'game_over'>('ready');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    wave: 1,
    difficulty: 'medium',
    kills: { soldiers: 0, tanks: 0, apcs: 0, helicopters: 0, paratroopers: 0, jets: 0, transportPlanes: 0 },
    shotsFired: 0,
    shotsHit: 0,
    baseHealth: 100,
    maxBaseHealth: 100,
    airstrikesAvailable: 2,
    kamikazeCooldown: 0,
    currentEchelon: 1,
    totalEchelons: 3,
    activeThreats: 0,
  });

  const [weapons, setWeapons] = useState<Record<WeaponType, WeaponState>>({
    m60: {
      type: 'm60',
      name: 'M60 General Purpose MG',
      ammo: 999,
      maxAmmo: 999,
      fireRateMs: 85,
      lastFired: 0,
      damage: 14,
      splashRadius: 0.6,
      projectileSpeed: 320,
      spread: 0.035,
      unlimited: true,
      reloading: false,
      reloadTimeMs: 2600,
      reloadStart: 0,
      heat: 0,
      overheated: false,
    },
    aa_gun: {
      type: 'aa_gun',
      name: 'ZU-23-2 Twin 23mm AA Gun',
      ammo: 400,
      maxAmmo: 400,
      fireRateMs: 90,
      lastFired: 0,
      damage: 18,
      splashRadius: 1.0,
      projectileSpeed: 220,
      spread: 0.02,
      unlimited: false,
      reloading: false,
      reloadTimeMs: 1400,
      reloadStart: 0,
    },
    heavy_cannon: {
      type: 'heavy_cannon',
      name: '105mm AP Heavy Cannon',
      ammo: 25,
      maxAmmo: 25,
      fireRateMs: 900,
      lastFired: 0,
      damage: 150,
      splashRadius: 8.0,
      projectileSpeed: 160,
      spread: 0.006,
      unlimited: false,
      reloading: false,
      reloadTimeMs: 2200,
      reloadStart: 0,
    },
    missile: {
      type: 'missile',
      name: 'Stinger / TOW Missiles',
      ammo: 5,
      maxAmmo: 5,
      fireRateMs: 1200,
      lastFired: 0,
      damage: 280,
      splashRadius: 12.0,
      projectileSpeed: 95,
      spread: 0.0,
      unlimited: false,
      reloading: false,
      reloadTimeMs: 3000,
      reloadStart: 0,
      lockOnStart: 0,
    },
    handgun: {
      type: 'handgun',
      name: '.45 Handgun',
      ammo: 7,
      maxAmmo: 7,
      fireRateMs: 280,
      lastFired: 0,
      damage: 34,
      splashRadius: 0.3,
      projectileSpeed: 240,
      spread: 0.008,
      unlimited: true,
      reloading: false,
      reloadTimeMs: 1500,
      reloadStart: 0,
    },
  });

  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('m60');
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);
  const [headingDeg, setHeadingDeg] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [autoFire, setAutoFire] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [aimAssist, setAimAssist] = useState<boolean>(false);
  const [haptics, setHaptics] = useState<boolean>(true);
  const [invertY, setInvertY] = useState<boolean>(false);
  const [gyroSensitivity, setGyroSensitivity] = useState<number>(1.0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [graphics, setGraphics] = useState<'low' | 'medium' | 'high'>('high');
  const [controlScheme, setControlScheme] = useState<'touch' | 'gyro' | 'hybrid'>('touch');
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen toggle
  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // ensure the 3D canvas refits the new viewport
      setTimeout(() => engineRef.current?.handleResize(), 30);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const handleFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    } catch { /* not supported */ }
  };

  // Detect touch devices & portrait orientation (force landscape on mobile)
  useEffect(() => {
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Try to lock to landscape on first user gesture (Android supports it; iOS ignores)
  useEffect(() => {
    const lock = async () => {
      try {
        const so = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
        if (so && typeof so.lock === 'function') {
          await so.lock('landscape');
        }
      } catch { /* unsupported / denied */ }
    };
    const onFirst = () => { lock(); window.removeEventListener('pointerdown', onFirst); };
    window.addEventListener('pointerdown', onFirst);
    return () => window.removeEventListener('pointerdown', onFirst);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize 3D GameEngine
    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    // Setup Engine Callbacks
    engine.onStatsUpdate = (newStats) => {
      setStats({ ...newStats });
    };

    engine.onWeaponUpdate = (newWeapons, curW) => {
      setWeapons({ ...newWeapons });
      setCurrentWeapon(curW);
    };

    engine.onRadarUpdate = (blips, heading) => {
      setRadarBlips(blips);
      setHeadingDeg(heading);
    };

    engine.onWaveComplete = (wave) => {
      setGameState('wave_cleared');
    };

    engine.onGameOver = (finalStats) => {
      setGameState('game_over');
      setStats({ ...finalStats });
    };

    engine.onNightChange = (night) => {
      setIsNight(night);
    };

    // NOTE: settings modal only opens via the explicit ⚙️ button. We intentionally
    // do NOT wire onMobileSettingsChange to open it, so no touch input can pop it.
    engine.onMobileSettingsChange = () => {};

    return () => {
      engine.cleanup();
      engineRef.current = null;
    };
  }, []);

  const handleSelectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    if (engineRef.current) {
      engineRef.current.setDifficulty(diff);
    }
  };

  const handleStartGame = () => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.setDifficulty(difficulty);
      engineRef.current.stats = {
        score: 0,
        highScore: Math.max(GameEngine.loadHighScore(), stats.score, stats.highScore),
        wave: 1,
        difficulty,
        kills: { soldiers: 0, tanks: 0, apcs: 0, helicopters: 0, paratroopers: 0, jets: 0, transportPlanes: 0 },
        shotsFired: 0,
        shotsHit: 0,
        baseHealth: 100,
        maxBaseHealth: 100,
        kamikazeCooldown: 0,
        airstrikesAvailable: 2,
        currentEchelon: 1,
        totalEchelons: 3,
        activeThreats: 0,
      };
      // Reset weapons to full magazines and start on the M60
      const eng = engineRef.current;
      (Object.keys(eng.weapons) as WeaponType[]).forEach((k) => {
        eng.weapons[k].ammo = eng.weapons[k].maxAmmo;
        eng.weapons[k].reloading = false;
        eng.weapons[k].lastFired = 0;
      });
      eng.switchWeapon('m60', true);
      eng.onWeaponUpdate && eng.onWeaponUpdate(eng.weapons, 'm60');
      setCurrentWeapon('m60');
      eng.startWave(1);
      setGameState('playing');
    }
  };

  const handleNextWave = () => {
    soundManager.init();
    if (engineRef.current) {
      const nextWave = stats.wave + 1;
      engineRef.current.startWave(nextWave);
      setGameState('playing');
    }
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleAirstrike = () => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.triggerAirstrike();
    }
  };

  const handleSwitchWeapon = (type: WeaponType) => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.switchWeapon(type);
    }
  };

  const handleReload = (type: WeaponType) => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.reloadWeapon(type);
    }
  };

  const handleToggleZoom = () => {
    if (engineRef.current) {
      engineRef.current.toggleZoom();
      setZoomLevel(engineRef.current.zoomLevel);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleFireStart = () => {
    soundManager.init();
    if (engineRef.current) {
      engineRef.current.isFiring = true;
      engineRef.current.triggerFire();
    }
  };

  const handleFireEnd = () => {
    if (engineRef.current) {
      engineRef.current.isFiring = false;
    }
  };

  const handleToggleAutoFire = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = engine.mobileSettings.autoFire === 'off' ? 'on' : 'off';
    engine.setMobileSettings({ autoFire: next });
    setAutoFire(next === 'on');
  };

  const applyMobileSettings = (patch: Partial<{ autoFire: 'off' | 'on' | 'smart'; aimAssist: boolean; haptics: boolean; invertY: boolean; gyroSensitivity: number; }>) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setMobileSettings(patch);
  };

  const handleFireFlare = () => {
    if (engineRef.current) engineRef.current.fireFlare();
  };

  const handleKamikaze = () => {
    soundManager.init();
    if (engineRef.current) engineRef.current.triggerKamikaze();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-mono">
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        id="game-3d-viewport"
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      />

      {/* Screen Hit Flash Effect when base is damaged */}
      {stats.baseHealth < 100 && stats.baseHealth > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.25)',
            opacity: Math.max(0, (1 - stats.baseHealth / 100) * 0.4),
          }}
        />
      )}

      {/* In-Game HUD (Weapons, Radar, Crosshairs, Ammo, Health) */}
      <TurretControlsHUD
        stats={stats}
        weapons={weapons}
        currentWeapon={currentWeapon}
        radarBlips={radarBlips}
        headingDeg={headingDeg}
        zoomLevel={zoomLevel}
        isMuted={isMuted}
        isNight={isNight}
        autoFire={autoFire}
        onSwitchWeapon={handleSwitchWeapon}
        onReload={handleReload}
        onToggleZoom={handleToggleZoom}
        onToggleMute={handleToggleMute}
        onFireStart={handleFireStart}
        onFireEnd={handleFireEnd}
        onAirstrike={handleAirstrike}
        onFlare={handleFireFlare}
        onToggleAutoFire={handleToggleAutoFire}
        onSettings={() => setSettingsOpen(true)}
        onFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
        kamikazeReady={(stats.kamikazeCooldown ?? 0) <= 0}
        onKamikaze={handleKamikaze}
      />

      {/* Overlays: Start Briefing, Wave Clear, Game Over */}
      <GameOverlay
        gameState={gameState}
        stats={stats}
        difficulty={difficulty}
        onSelectDifficulty={handleSelectDifficulty}
        onStartGame={handleStartGame}
        onNextWave={handleNextWave}
        onRestart={handleRestart}
      />

      {/* Settings / accessibility panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoFire={autoFire ? 'on' : 'off'}
        aimAssist={aimAssist}
        haptics={haptics}
        invertY={invertY}
        gyroSensitivity={gyroSensitivity}
        reducedMotion={reducedMotion}
        onAutoFire={(v) => { setAutoFire(v !== 'off'); applyMobileSettings({ autoFire: v }); }}
        onAimAssist={(v) => { setAimAssist(v); applyMobileSettings({ aimAssist: v }); }}
        onHaptics={(v) => { setHaptics(v); applyMobileSettings({ haptics: v }); }}
        onInvertY={(v) => { setInvertY(v); applyMobileSettings({ invertY: v }); }}
        onGyroSensitivity={(v) => { setGyroSensitivity(v); applyMobileSettings({ gyroSensitivity: v }); }}
        onReducedMotion={(v) => { setReducedMotion(v); if (engineRef.current) engineRef.current.reducedMotion = v; }}
        graphics={graphics}
        onGraphics={(v) => { setGraphics(v); if (engineRef.current) engineRef.current.setGraphicsPreset(v); }}
        controlScheme={controlScheme}
        onControlScheme={(v) => {
          setControlScheme(v);
          const engine = engineRef.current;
          if (engine) {
            engine.setMobileSettings({ controlScheme: v });
            // Ask permission in the same user gesture (iOS needs this)
            if (v !== 'touch' && engine.mobileControls) {
              engine.mobileControls.requestGyroPermission();
            }
          }
        }}
      />

      {/* Rotate-to-landscape prompt (mobile portrait) */}
      {isTouch && isPortrait && gameState !== 'ready' && (
        <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="text-6xl" style={{ animation: 'rotateHint 1.6s ease-in-out infinite' }}>📱↻</div>
          <div className="font-mono text-xl font-bold text-amber-400 tracking-widest">ROTATE DEVICE</div>
          <div className="font-mono text-xs text-zinc-400 max-w-xs leading-relaxed">
            This battle is played in <b className="text-white">landscape</b>. Turn your phone sideways for full view and controls.
          </div>
        </div>
      )}
    </div>
  );
}
