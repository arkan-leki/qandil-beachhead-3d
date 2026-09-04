/**
 * 3D Game Engine for Qandil Beachhead 3D.
 * Manages Three.js scene, rendering, entity simulation, camera controls,
 * weapon firing, collision detection, and particle systems.
 */
import * as THREE from 'three';
import { soundManager } from '../audio/soundManager';
import {
  Difficulty,
  EnemyEntity,
  EnemyType,
  GameStats,
  ParticleEntity,
  ProjectileEntity,
  RadarBlip,
  WaveConfig,
  WeaponState,
  WeaponType,
} from '../types';
import {
  createAntiAirGunTurret,
  createAPCModel,
  createEnemyJetModel,
  createHelicopterModel,
  createJetModel,
  createMountainTerrain,
  createParatrooperModel,
  createShaheenDroneModel,
  createSoldierModel,
  createTankModel,
  createTransportPlaneModel,
} from './modelFactory';
import { GunViewModel } from './gunViewModel';
import { MobileControls, MobileSettings } from './mobileControls';

// Soft radial-gradient glow sprite (used as the billboard particle texture).
// `edgeFalloff` (0..1) controls how soft the outer rim is: high = bright hot core,
// low = puffy translucent smoke blob.
function createGlowSpriteData(edgeFalloff: number): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const core = Math.max(0, Math.min(1, edgeFalloff));
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(core * 0.35, 'rgba(255,255,255,0.85)');
  grad.addColorStop(core, 'rgba(255,255,255,0.30)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export interface DifficultyConfig {
  countMult: number;
  hpMult: number;
  accuracySpread: number; // in meters (radius of aim offset at player bunker)
  fireCooldownMult: number;
  damageMult: number;
  maxConcurrent: number; // maximum simultaneous active enemies on battlefield
  minSpawnInterval: number; // seconds between individual spawns
  subWavePause: number; // tactical pause between echelons in seconds
  waveClearHeal: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    countMult: 0.7,
    hpMult: 0.75,
    accuracySpread: 4.8, // wide scatter; many shots miss the 3.2m bunker radius
    fireCooldownMult: 1.35, // 35% slower enemy firing
    damageMult: 0.7,
    maxConcurrent: 5, // maximum 5 active enemies on the field at any moment
    minSpawnInterval: 3.2,
    subWavePause: 10.0,
    waveClearHeal: 35,
  },
  medium: {
    countMult: 1.0,
    hpMult: 1.0,
    accuracySpread: 2.2, // standard challenge; ~50-60% on target
    fireCooldownMult: 1.0,
    damageMult: 1.0,
    maxConcurrent: 8, // maximum 8 active enemies on field
    minSpawnInterval: 2.4,
    subWavePause: 8.0,
    waveClearHeal: 25,
  },
  hard: {
    countMult: 1.4,
    hpMult: 1.35,
    accuracySpread: 0.7, // tight military accuracy directly on the bunker slit
    fireCooldownMult: 0.8, // 20% faster enemy firing
    damageMult: 1.25,
    maxConcurrent: 12, // intensive swarm attack
    minSpawnInterval: 1.8,
    subWavePause: 5.5,
    waveClearHeal: 15,
  },
};

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  // First-Person Gun Viewmodel (Beach Head Bunker Weapon)
  private gunView: GunViewModel;

  // Allied Air Support (Fighter Jet Strikes)
  private alliedJets: { group: THREE.Group; velocity: THREE.Vector3; bombsLeft: number; lastBombTime: number }[] = [];

  // Player Turret (two ZU-23 AA units + twin 105mm cannons)
  private turretBaseGroup: THREE.Group;
  private turretPitchGroup: THREE.Group;
  private leftBarrel: THREE.Mesh;
  private rightBarrel: THREE.Mesh;
  private aaBarrelL2: THREE.Mesh;
  private aaBarrelR2: THREE.Mesh;
  private cannonL: THREE.Mesh;
  private cannonR: THREE.Mesh;
  private muzzlePoints: {
    left: THREE.Vector3;
    left2: THREE.Vector3;
    right2: THREE.Vector3;
    right: THREE.Vector3;
    center: THREE.Vector3;
    cannonL: THREE.Vector3;
    cannonR: THREE.Vector3;
    rocketL: THREE.Vector3;
    rocketR: THREE.Vector3;
  };

  // Orientation & Controls
  public yaw: number = 0; // Horizontal radians (0 to 2*PI)
  public pitch: number = 0.05; // Vertical radians (-0.25 to 0.9)
  public zoomLevel: number = 1.0; // 1.0x, 2.5x, 5.0x
  private isPointerLocked: boolean = false;
  private isDragging: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  public isFiring: boolean = false;

  // Mobile / gyroscope input
  public mobileControls!: MobileControls;
  public mobileSettings: MobileSettings = {
    controlScheme: 'touch', gyroSensitivity: 1.0, gyroDeadZone: 0.06,
    invertY: false, autoFire: 'off', aimAssist: false, haptics: true,
  };
  public onMobileSettingsChange?: (s: MobileSettings) => void;

  // Day/night atmosphere
  public isNight: boolean = false;
  private dayNightT: number = 0; // 0=day, 1=night (lerped)
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private searchlight!: THREE.SpotLight;
  private searchlightTarget: THREE.Object3D = new THREE.Object3D();
  private flareLights: { light: THREE.PointLight; life: number; maxLife: number }[] = [];

  // Weapons State
  public currentWeapon: WeaponType = 'm60';
  public weapons: Record<WeaponType, WeaponState> = {
    m60: {
      type: 'm60',
      name: 'M60 General Purpose MG',
      ammo: 999,
      maxAmmo: 999,
      fireRateMs: 85, // fast sustained fire
      lastFired: 0,
      damage: 14,
      splashRadius: 0.6,
      projectileSpeed: 320,
      spread: 0.035, // some drift at range
      unlimited: true, // infinite ammo, but overheats
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
      fireRateMs: 90, // fast rapid fire
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
      spread: 0.0, // homing
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
      spread: 0.008, // very accurate, low damage fallback
      unlimited: true, // infinite reserve, 7-round mag + reload
      reloading: false,
      reloadTimeMs: 1500,
      reloadStart: 0,
    },
  };

  private aaAlternateBarrel: boolean = false; // toggles LEFT vs RIGHT ZU unit per shot
  private aaBarrelPhase: boolean = false;     // toggles which barrel of the chosen unit
  private cannonSide: boolean = false;        // toggles LEFT vs RIGHT 105mm cannon per shot
  private recoilL: number = 0;
  private recoilR: number = 0;
  private recoilHeavyL: number = 0;
  private recoilHeavyR: number = 0;
  private lastFiredSide: number = 0;          // -1 left, +1 right, 0 center (viewmodel recoil)

  // Entities & Simulation
  private enemies: EnemyEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private particles: ParticleEntity[] = [];
  private nextEntityId: number = 1;
  private getHeightAt: (x: number, z: number) => number;

  // Particle Mesh Pool (billboarded glow sprites via THREE.Points)
  private glowGeo: THREE.BufferGeometry;
  private smokeGeo: THREE.BufferGeometry;
  private glowMat: THREE.PointsMaterial;
  private smokeMat: THREE.PointsMaterial;
  private glowPoints: THREE.Points;
  private smokePoints: THREE.Points;
  private readonly MAX_PARTICLES = 350;
  private readonly SMOKE_CAP = 160;
  // Floating damage/score text sprites
  private floaters: { sprite: THREE.Sprite; life: number; maxLife: number }[] = [];

  // Screen shake
  public screenShake: number = 0;
  public reducedMotion: boolean = false;
  public graphicsPreset: 'low' | 'medium' | 'high' = 'high';

  // Game Progress & Difficulty
  public gameState: 'ready' | 'playing' | 'wave_cleared' | 'game_over' = 'ready';
  public difficulty: Difficulty = 'medium';
  public stats: GameStats = {
    score: 0,
    highScore: 0,
    wave: 1,
    difficulty: 'medium',
    kills: { soldiers: 0, tanks: 0, apcs: 0, helicopters: 0, paratroopers: 0 },
    shotsFired: 0,
    shotsHit: 0,
    baseHealth: 100,
    maxBaseHealth: 100,
    totalWaveEnemies: 0,
    remainingWaveEnemies: 0,
    airstrikesAvailable: 2,
    kamikazeCooldown: 0, // 0 = ready; otherwise ms remaining
    currentEchelon: 1,
    totalEchelons: 3,
    activeThreats: 0,
  };

  private static readonly HIGH_SCORE_KEY = 'beachhead-highscore-v1';
  public static loadHighScore(): number {
    try {
      return parseInt(localStorage.getItem(GameEngine.HIGH_SCORE_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }
  public static saveHighScore(v: number) {
    try {
      localStorage.setItem(GameEngine.HIGH_SCORE_KEY, String(v));
    } catch {
      /* ignore */
    }
  }

  // Tactical Echelon Wave Spawning System (Paced deployment, not all at once)
  private currentWaveConfig: WaveConfig | null = null;
  private echelons: { name: string; queue: EnemyType[] }[] = [];
  private currentEchelonIndex: number = 0;
  private lastSpawnTime: number = 0;
  private echelonPauseTimer: number = 0;
  private waveClearTimer: number = 0;
  private waveDamageTaken: boolean = false;

  // Callback hooks for React UI
  public onStatsUpdate?: (stats: GameStats) => void;
  public onWeaponUpdate?: (weapons: Record<WeaponType, WeaponState>, current: WeaponType) => void;
  public onRadarUpdate?: (blips: RadarBlip[], headingDeg: number) => void;
  public onWaveComplete?: (wave: number) => void;
  public onGameOver?: (stats: GameStats) => void;
  public onNightChange?: (night: boolean) => void;

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
    this.stats.difficulty = diff;
    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
  }

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.stats.highScore = GameEngine.loadHighScore();

    // 1. Scene & Atmosphere (Crisp Qandil Mountain Horizon)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8cb5dc); // vibrant blue sky
    this.scene.fog = new THREE.Fog(0x9ec0de, 240, 800); // clear air; distant aircraft visible approaching

    // 2. Camera setup at player redoubt position (elevated for commanding 360 overview)
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1600);
    this.camera.position.set(0, 10.6, 0.6); // raised overlook: 6m hilltop + 4.6m observer tower

    // 3. Renderer with shadows and HDR tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Lighting for dramatic Qandil mountain peaks
    this.ambientLight = new THREE.AmbientLight(0xdbe3ea, 0.85);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    this.sunLight.position.set(80, 120, -60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -120;
    this.sunLight.shadow.camera.right = 120;
    this.sunLight.shadow.camera.top = 120;
    this.sunLight.shadow.camera.bottom = -120;
    this.scene.add(this.sunLight);

    // Secondary fill light for mountain canyons
    this.fillLight = new THREE.DirectionalLight(0x758595, 0.6);
    this.fillLight.position.set(-60, 40, 60);
    this.scene.add(this.fillLight);

    // Night searchlight: cone that follows the turret aim (visible only at night)
    this.searchlightTarget.position.set(0, 0, -60);
    this.scene.add(this.searchlightTarget);
    this.searchlight = new THREE.SpotLight(0xfff6d8, 0, 900, 0.5, 0.6, 1.0);
    this.searchlight.position.set(0, 8, 0);
    this.searchlight.angle = 0.35;
    this.searchlight.penumbra = 0.6;
    this.searchlight.decay = 1.0;
    this.searchlight.target = this.searchlightTarget;
    this.scene.add(this.searchlight);

    // 5. Build Qandil Mountain Terrain
    const { terrainGroup, getHeightAt } = createMountainTerrain();
    this.getHeightAt = getHeightAt;
    this.scene.add(terrainGroup);

    // 6. Build Player Anti-Air Gun Turret atop central redoubt knoll (y = 6.0m)
    const turretData = createAntiAirGunTurret();
    this.turretBaseGroup = turretData.turretGroup;
    this.turretPitchGroup = turretData.pitchGroup;
    this.leftBarrel = turretData.leftBarrel;
    this.rightBarrel = turretData.rightBarrel;
    this.aaBarrelL2 = turretData.aaBarrelL2;
    this.aaBarrelR2 = turretData.aaBarrelR2;
    this.cannonL = turretData.cannonL;
    this.cannonR = turretData.cannonR;
    this.muzzlePoints = turretData.muzzlePoints;
    this.turretBaseGroup.position.set(0, 6.0, 0);
    this.scene.add(this.turretBaseGroup);

    // 6b. First-Person Viewmodel Gun (Beach Head Bunker Weapon - Mounted to camera)
    this.gunView = new GunViewModel();
    this.camera.add(this.gunView.group);
    this.scene.add(this.camera);

    // 7. Particle system (billboarded glow sprites via THREE.Points)
    // Two additive/alpha layers: a "glow" layer for fire/muzzle/sparks and a
    // softer alpha "smoke/dust" layer. Each uses its own geometry so the two
    // blend modes never double-render.
    const glowSprite = createGlowSpriteData(0.9);       // bright hot core edge
    const smokeSprite = createGlowSpriteData(0.25);     // soft puffy falloff
    const makeParticleGeo = (cap: number): THREE.BufferGeometry => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cap * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cap * 3), 3));
      g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(cap), 1));
      const p = g.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < cap; i++) p.setXYZ(i, 0, -9999, 0);
      return g;
    };
    this.glowGeo = makeParticleGeo(this.MAX_PARTICLES);
    this.smokeGeo = makeParticleGeo(this.SMOKE_CAP);
    this.glowMat = new THREE.PointsMaterial({
      size: 8, map: glowSprite, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    this.smokeMat = new THREE.PointsMaterial({
      size: 8, map: smokeSprite, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true, opacity: 0.5,
    });
    this.glowPoints = new THREE.Points(this.glowGeo, this.glowMat);
    this.glowPoints.frustumCulled = false;
    this.scene.add(this.glowPoints);
    this.smokePoints = new THREE.Points(this.smokeGeo, this.smokeMat);
    this.smokePoints.frustumCulled = false;
    this.scene.add(this.smokePoints);

    // 8. Event Listeners
    this.setupEventListeners();
    this.setupMobileControls();

    // 9. Start Render Loop
    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  /* ================= CONTROLS & INPUT ================= */
  private setupEventListeners() {
    const el = this.renderer.domElement;

    // Mouse Look / Pointer Drag
    el.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.isFiring = true;
      } else if (e.button === 2) {
        // Right click toggle zoom
        this.toggleZoom();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isDragging = false;
        this.isFiring = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.rotateTurret(e.movementX * 0.0024, e.movementY * 0.002);
      } else if (this.isDragging) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        this.rotateTurret(dx * 0.0032, dy * 0.0028);
      }
    });

    // Touch support for mobile / tablet.
    // SPLIT-ZONE CONTROLS: the LEFT side of the screen aims the camera;
    // the RIGHT side changes gun. Only aim for touches that start on the left.
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        if (t.clientX < window.innerWidth * 0.55) {
          this.isDragging = true;
          this.lastPointerX = t.clientX;
          this.lastPointerY = t.clientY;
        }
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0 && e.touches[0].clientX < window.innerWidth * 0.6) {
        const dx = e.touches[0].clientX - this.lastPointerX;
        const dy = e.touches[0].clientY - this.lastPointerY;
        this.lastPointerX = e.touches[0].clientX;
        this.lastPointerY = e.touches[0].clientY;
        this.rotateTurret(dx * 0.004, dy * 0.0035);
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Prevent context menu
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse Wheel Zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        if (this.zoomLevel < 5.0) this.toggleZoom();
      } else {
        if (this.zoomLevel > 1.0) this.toggleZoom();
      }
    }, { passive: false });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Digit1') this.switchWeapon('m60');
      if (e.code === 'Digit2') this.switchWeapon('aa_gun');
      if (e.code === 'Digit3') this.switchWeapon('heavy_cannon');
      if (e.code === 'Digit4') this.switchWeapon('missile');
      if (e.code === 'Digit5') this.switchWeapon('handgun');
      if (e.code === 'KeyB') this.triggerAirstrike();
      if (e.code === 'KeyF') this.fireFlare();
      if (e.code === 'KeyR') this.reloadWeapon(this.currentWeapon);
      if (e.code === 'KeyZ' || e.code === 'ShiftLeft') this.toggleZoom();
      if (e.code === 'Space') this.isFiring = true;
      // DEV: skip to next wave (]) / toggle night ([)
      if (e.code === 'BracketRight') this.skipToNextWave();
      if (e.code === 'BracketLeft') this.setNight(!this.isNight);
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.isFiring = false;
    });

    // Window Resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private setupMobileControls() {
    const el = this.renderer.domElement;
    this.mobileControls = new MobileControls(el, {
      onFireStart: () => { this.isFiring = true; this.triggerFire(); },
      onFireEnd: () => { this.isFiring = false; },
      onAirstrike: () => this.triggerAirstrike(),
      onSwitchWeapon: (dir) => this.cycleWeapon(dir),
      onReload: () => this.reloadWeapon(this.currentWeapon),
      onToggleZoom: () => this.toggleZoom(),
      onAim: (dy, dp) => this.rotateTurret(dy, dp),
      isOnTarget: () => this.isCrosshairOnTarget(),
      onSettingsOpen: () => {
        this.mobileSettings = this.mobileControls.getSettings();
        if (this.onMobileSettingsChange) this.onMobileSettingsChange(this.mobileSettings);
      },
    });
    this.mobileControls.init();
    this.mobileSettings = this.mobileControls.getSettings();
  }

  // Whether the crosshair is currently over a live enemy (for auto-fire)
  public isCrosshairOnTarget(): boolean {
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
    return !!this.findTargetInCrosshair(dir);
  }

  public setMobileSettings(s: Partial<MobileSettings>) {
    this.mobileControls.setSettings(s);
    this.mobileSettings = this.mobileControls.getSettings();
    if (this.onMobileSettingsChange) this.onMobileSettingsChange(this.mobileSettings);
  }

  public setGraphicsPreset(preset: 'low' | 'medium' | 'high') {
    this.graphicsPreset = preset;
    const scale = preset === 'low' ? 0.5 : preset === 'medium' ? 0.75 : 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * scale);
    this.renderer.shadowMap.enabled = preset !== 'low';
    // Also reduce sun shadow map resolution on low for a meaningful GPU win
    this.sunLight.shadow.mapSize.width = preset === 'low' ? 512 : preset === 'medium' ? 1024 : 2048;
    this.sunLight.shadow.mapSize.height = preset === 'low' ? 512 : preset === 'medium' ? 1024 : 2048;
  }

  public rotateTurret(deltaYaw: number, deltaPitch: number) {
    // Zoom dampens sensitivity for precision sniping
    const zoomFactor = 1.0 / this.zoomLevel;
    this.yaw -= deltaYaw * zoomFactor;
    // Normalize yaw to [0, 2*PI]
    this.yaw = (this.yaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

    this.pitch -= deltaPitch * zoomFactor;
    // Clamp pitch between looking down at approaching infantry (-0.48 rad, ~-27 deg) and high anti-air sky (+1.15 rad, ~66 deg)
    this.pitch = THREE.MathUtils.clamp(this.pitch, -0.48, 1.15);

    // Apply orientation to turret models
    this.turretBaseGroup.rotation.y = this.yaw;
    this.turretPitchGroup.rotation.x = this.pitch;

    // Position camera at gunner eye level above the elevated hilltop redoubt
    const camDist = 0.6;
    const redoubtY = 6.0;
    const camHeight = redoubtY + 4.6; // 10.6m total height
    this.camera.position.x = Math.sin(this.yaw) * camDist;
    this.camera.position.z = Math.cos(this.yaw) * camDist;
    this.camera.position.y = camHeight + Math.sin(this.pitch) * 0.18;

    const lookTarget = new THREE.Vector3(
      this.camera.position.x - Math.sin(this.yaw) * Math.cos(this.pitch) * 80,
      this.camera.position.y + Math.sin(this.pitch) * 80,
      this.camera.position.z - Math.cos(this.yaw) * Math.cos(this.pitch) * 80
    );
    this.camera.lookAt(lookTarget);
  }

  public toggleZoom() {
    if (this.zoomLevel === 1.0) {
      this.zoomLevel = 2.2;
    } else if (this.zoomLevel === 2.2) {
      this.zoomLevel = 4.8;
    } else {
      this.zoomLevel = 1.0;
    }
    this.camera.fov = 50 / this.zoomLevel;
    this.camera.updateProjectionMatrix();
  }

  public switchWeapon(type: WeaponType) {
    if (this.currentWeapon === type) return;
    this.currentWeapon = type;
    this.gunView.setWeapon(type);
    soundManager.playReload();
    if (this.onWeaponUpdate) {
      this.onWeaponUpdate(this.weapons, this.currentWeapon);
    }
  }

  // Cycle weapon by +1/-1 (used by swipe gestures)
  public cycleWeapon(dir: 1 | -1) {
    const order: WeaponType[] = ['m60', 'aa_gun', 'heavy_cannon', 'missile', 'handgun'];
    const idx = order.indexOf(this.currentWeapon);
    const next = order[(idx + dir + order.length) % order.length];
    this.switchWeapon(next);
  }

  // DEV/test: immediately clear the wave and start the next one
  public skipToNextWave() {
    for (const e of this.enemies) {
      if (!e.dead) {
        e.dead = true;
        this.scene.remove(e.meshGroup);
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];
    this.echelons = [];
    this.startWave(this.stats.wave + 1);
  }

  public triggerAirstrike() {
    if (this.stats.airstrikesAvailable <= 0 || this.gameState !== 'playing') return;

    this.stats.airstrikesAvailable--;
    soundManager.playJetFlyby();
    // B-58 heavy bomber: slower, longer run, delayed carpet-bombing
    const { group: jetGroup } = createJetModel();
    jetGroup.scale.set(2.0, 2.0, 2.0);
    jetGroup.position.set(0, 40, 240);
    jetGroup.lookAt(0, 40, -300);
    this.scene.add(jetGroup);

    this.alliedJets.push({
      group: jetGroup,
      velocity: new THREE.Vector3(0, -0.6, -120),
      bombsLeft: 10,
      // 3s delay before bombs start dropping (per blueprint)
      lastBombTime: performance.now() + 3000,
    });

    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.stats);
    }
  }

  // Shaheen kamikaze drone: guided, detonates on the target under the crosshair.
  // One use per 60s cooldown.
  private static readonly KAMIKAZE_COOLDOWN_MS = 60000;
  public get kamikazeReady(): boolean {
    return this.stats.kamikazeCooldown <= 0;
  }
  public triggerKamikaze() {
    if (!this.kamikazeReady || this.gameState !== 'playing') return;

    // Target the enemy under (or nearest to) the crosshair
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
    const target = this.findTargetInCrosshair(dir);

    // Launch origin above/before the bunker, on the aim line
    const fireOrigin = new THREE.Vector3().copy(this.camera.position).addScaledVector(dir, 2.5);
    const { group } = createShaheenDroneModel();
    group.position.copy(fireOrigin);
    group.lookAt(fireOrigin.x + dir.x * 20, fireOrigin.y + dir.y * 20, fireOrigin.z + dir.z * 20);
    this.scene.add(group);

    this.projectiles.push({
      id: this.nextEntityId++,
      type: 'player_drone',
      mesh: group,
      position: { x: fireOrigin.x, y: fireOrigin.y, z: fireOrigin.z },
      velocity: { x: dir.x * 30, y: dir.y * 30, z: dir.z * 30 },
      damage: 2200,
      splashRadius: 18.0,
      lifetime: 0,
      maxLifetime: 12,
      targetId: target?.id,
    });

    soundManager.playMissileLaunch();
    this.stats.kamikazeCooldown = GameEngine.KAMIKAZE_COOLDOWN_MS;

    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
  }

  public reloadWeapon(type: WeaponType) {
    const w = this.weapons[type];
    if (w.reloading || w.ammo >= w.maxAmmo) return;
    w.reloading = true;
    w.reloadStart = performance.now();
    soundManager.playReload();
    if (this.onWeaponUpdate) {
      this.onWeaponUpdate(this.weapons, this.currentWeapon);
    }
  }

  private onWindowResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public handleResize() {
    this.onWindowResize();
  }

  /* ================= COMBAT & FIRING ================= */
  public triggerFire() {
    const now = performance.now();
    const w = this.weapons[this.currentWeapon];

    if (w.reloading) return;

    // M60 overheat blocks firing until cooled down
    if (w.overheated) return;

    if (w.ammo <= 0) {
      if (w.unlimited) {
        // Infinite-reserve weapon: auto-reload a fresh magazine
        this.reloadWeapon(this.currentWeapon);
      } else {
        this.reloadWeapon(this.currentWeapon);
      }
      return;
    }

    if (now - w.lastFired < w.fireRateMs) return;

    w.lastFired = now;
    w.ammo--;
    this.stats.shotsFired++;

    // M60 heat accumulation (overheat after ~5s sustained fire)
    if (this.currentWeapon === 'm60') {
      w.heat = Math.min(1, (w.heat || 0) + 0.028);
      if (w.heat >= 1) {
        w.overheated = true;
      }
    }

    // First-person recoil/casing are applied at the end of triggerFire with the
    // correct side barrel (set by each weapon branch below).
    if (Math.random() < (this.currentWeapon === 'handgun' ? 0.9 : 0.4)) soundManager.playBrassClink();

    // Calculate forward aim direction from turret orientation
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    // Apply weapon spread (M60 drifts, cannon/missile stay tight)
    if (w.spread > 0) {
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(dir, up).normalize();
      const localUp = new THREE.Vector3().crossVectors(right, dir).normalize();
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * w.spread; // uniform-ish cone
      dir.addScaledVector(right, Math.cos(a) * r);
      dir.addScaledVector(localUp, Math.sin(a) * r);
      dir.normalize();
    }

    // Fire from just ahead of the gunner's eye (on the aim line) instead of the
    // buried barrel muzzle. The knoll plateau under the turret is ~2.8m high, so
    // rounds spawned at the muzzle (~2.15m) instantly "hit terrain" and died on
    // the spot -- making enemies invincible. Spawning on the camera aim line also
    // keeps the crosshair perfectly accurate at every zoom level.
    const fireOrigin = new THREE.Vector3().copy(this.camera.position).addScaledVector(dir, 1.5);

    if (this.currentWeapon === 'm60') {
      // M60 general purpose machine gun: rapid tracers from the left/right mount
      this.aaAlternateBarrel = !this.aaAlternateBarrel;
      const isLeft = this.aaAlternateBarrel;
      soundManager.playM60();
      this.recoilL = 0.35;
      this.recoilR = 0.35;
      this.lastFiredSide = isLeft ? -1 : 1;

      const localMuzzle = isLeft ? this.muzzlePoints.left : this.muzzlePoints.right;
      const worldMuzzle = localMuzzle.clone().applyMatrix4(this.turretPitchGroup.matrixWorld);
      this.spawnMuzzleFlash(worldMuzzle, 0.9, '#ffd27a');

      this.spawnPlayerProjectile('player_bullet', fireOrigin, dir, w.projectileSpeed, w.damage, w.splashRadius);
      this.screenShake = Math.min(0.22, this.screenShake + 0.04);

    } else if (this.currentWeapon === 'aa_gun') {
      // TWO ZU-23 units: one on the left, one on the right. Every shot fires a
      // single barrel, alternating sides (left unit, right unit, left unit...)
      // and alternating which of that unit's two barrels fires.
      this.aaAlternateBarrel = !this.aaAlternateBarrel; // side L/R
      const isLeft = this.aaAlternateBarrel;
      this.aaBarrelPhase = !this.aaBarrelPhase;         // barrel 1/2 on that side
      soundManager.playAAGun(isLeft);

      if (isLeft) {
        this.recoilL = 0.55;
      } else {
        this.recoilR = 0.55;
      }
      this.lastFiredSide = isLeft ? -1 : 1;

      // Pick the barrel muzzle on the chosen side
      const localMuzzle = isLeft
        ? (this.aaBarrelPhase ? this.muzzlePoints.left : this.muzzlePoints.left2)
        : (this.aaBarrelPhase ? this.muzzlePoints.right : this.muzzlePoints.right2);
      const worldMuzzle = localMuzzle.clone().applyMatrix4(this.turretPitchGroup.matrixWorld);

      this.spawnMuzzleFlash(worldMuzzle, 0.8, '#ffcc44');

      // Create high-velocity 23mm tracer projectile
      this.spawnPlayerProjectile('player_bullet', fireOrigin, dir, w.projectileSpeed, w.damage, w.splashRadius);
      this.screenShake = Math.min(0.2, this.screenShake + 0.05);

    } else if (this.currentWeapon === 'heavy_cannon') {
      // TWO 105mm cannons (left + right), each shot fires one side alternately
      soundManager.playHeavyCannon();
      this.cannonSide = !this.cannonSide;
      if (this.cannonSide) {
        this.recoilHeavyL = 0.9;
      } else {
        this.recoilHeavyR = 0.9;
      }
      this.lastFiredSide = this.cannonSide ? -1 : 1;

      const worldMuzzle = (this.cannonSide ? this.muzzlePoints.cannonL : this.muzzlePoints.cannonR)
        .clone().applyMatrix4(this.turretPitchGroup.matrixWorld);
      this.spawnMuzzleFlash(worldMuzzle, 2.2, '#ff8822');

      this.spawnPlayerProjectile('player_cannon', fireOrigin, dir, w.projectileSpeed, w.damage, w.splashRadius);
      this.screenShake = Math.min(0.65, this.screenShake + 0.35);

    } else if (this.currentWeapon === 'missile') {
      // Guided / Surface-to-Air Missile
      soundManager.playMissileLaunch();
      this.lastFiredSide = 0;
      const isLeft = Math.random() < 0.5;
      const localMuzzle = isLeft ? this.muzzlePoints.rocketL : this.muzzlePoints.rocketR;
      const worldMuzzle = localMuzzle.clone().applyMatrix4(this.turretPitchGroup.matrixWorld);

      this.spawnMuzzleFlash(worldMuzzle, 1.4, '#ffaa33');

      // Find best target near crosshair for homing guidance
      const target = this.findTargetInCrosshair(dir);
      this.spawnPlayerProjectile('player_missile', fireOrigin, dir, w.projectileSpeed, w.damage, w.splashRadius, target?.id);
      this.screenShake = Math.min(0.3, this.screenShake + 0.1);

    } else if (this.currentWeapon === 'handgun') {
      // .45 sidearm: accurate single shot, low recoil, weak vs armor
      soundManager.playHandgun();
      this.recoilL = 0.25;
      this.lastFiredSide = 0;

      const localMuzzle = this.muzzlePoints.center.clone();
      const worldMuzzle = localMuzzle.clone().applyMatrix4(this.turretPitchGroup.matrixWorld);
      this.spawnMuzzleFlash(worldMuzzle, 0.6, '#ffd9a0');

      this.spawnPlayerProjectile('player_bullet', fireOrigin, dir, w.projectileSpeed, w.damage, w.splashRadius);
      this.screenShake = Math.min(0.14, this.screenShake + 0.03);
    }

    // First-person gun recoil + casing ejection (side-aware for AA/cannon)
    const recoilStrength =
      this.currentWeapon === 'heavy_cannon' ? 2.0 :
      this.currentWeapon === 'missile' ? 1.4 :
      this.currentWeapon === 'm60' ? 0.7 :
      this.currentWeapon === 'handgun' ? 0.4 : 1.0;
    this.gunView.triggerRecoil(recoilStrength, this.lastFiredSide);

    if (w.ammo <= 0 && !w.unlimited) {
      this.reloadWeapon(this.currentWeapon);
    } else if (w.ammo <= 0 && w.unlimited && this.currentWeapon === 'handgun') {
      // Handgun is infinite-reserve: reload a fresh 7-round mag
      this.reloadWeapon(this.currentWeapon);
    }

    if (this.onWeaponUpdate) {
      this.onWeaponUpdate(this.weapons, this.currentWeapon);
    }
  }

  private findTargetInCrosshair(aimDir: THREE.Vector3): EnemyEntity | null {
    let bestTarget: EnemyEntity | null = null;
    let closestDist = Infinity;

    for (const e of this.enemies) {
      if (e.dead) continue;
      const toEnemy = new THREE.Vector3(e.position.x, e.position.y, e.position.z).normalize();
      const dot = aimDir.dot(toEnemy);
      if (dot > 0.88) { // within target acquisition cone
        const dist = Math.hypot(e.position.x, e.position.y, e.position.z);
        if (dist < closestDist) {
          closestDist = dist;
          bestTarget = e;
        }
      }
    }
    return bestTarget;
  }

  private spawnPlayerProjectile(
    type: 'player_bullet' | 'player_cannon' | 'player_missile',
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number,
    splashRadius: number,
    targetId?: number
  ) {
    let mesh: THREE.Mesh;
    if (type === 'player_bullet') {
      const geo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
      mesh = new THREE.Mesh(geo, mat);
    } else if (type === 'player_cannon') {
      const geo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff9922 });
      mesh = new THREE.Mesh(geo, mat);
    } else {
      // Missile
      const geo = new THREE.ConeGeometry(0.25, 1.8, 8);
      geo.rotateX(Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
      mesh = new THREE.Mesh(geo, mat);
    }

    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      type,
      mesh,
      position: { x: origin.x, y: origin.y, z: origin.z },
      velocity: { x: direction.x * speed, y: direction.y * speed, z: direction.z * speed },
      damage,
      splashRadius,
      lifetime: 0,
      maxLifetime: 3.5,
      targetId,
    });
  }

  private spawnMuzzleFlash(pos: THREE.Vector3, scale: number, color: string) {
    // Bright directional flash burst + small fan of sparks
    this.particles.push({
      x: pos.x, y: pos.y, z: pos.z, vx: 0, vy: (Math.random() - 0.5) * 1.5, vz: 0,
      color: '#fffbe0', size: scale * 3.4, life: 0, maxLife: 0.09,
    });
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: pos.x + (Math.random() - 0.5) * 0.4,
        y: pos.y + (Math.random() - 0.5) * 0.4,
        z: pos.z + (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        vz: (Math.random() - 0.5) * 4,
        color,
        size: scale * (0.9 + Math.random() * 0.5),
        life: 0,
        maxLife: 0.14,
      });
    }
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ================= DAY / NIGHT & LIGHTING ================= */
  public setNight(night: boolean) {
    this.isNight = night;
    if (this.onNightChange) this.onNightChange(night);
  }

  // Blueprint difficulty scaling by wave band (returns multipliers)
  private waveScale(wave: number): { speedMult: number; damageMult: number; hpMult: number; spawnSpeedMult: number } {
    if (wave <= 3) return { speedMult: 1.0, damageMult: 1.0, hpMult: 1.0, spawnSpeedMult: 1.0 };
    if (wave <= 6) return { speedMult: 1.05, damageMult: 1.1, hpMult: 1.05, spawnSpeedMult: 0.9 };
    if (wave <= 9) return { speedMult: 1.1, damageMult: 1.2, hpMult: 1.15, spawnSpeedMult: 0.8 };
    if (wave <= 12) return { speedMult: 1.15, damageMult: 1.3, hpMult: 1.25, spawnSpeedMult: 0.7 };
    if (wave <= 15) return { speedMult: 1.2, damageMult: 1.4, hpMult: 1.35, spawnSpeedMult: 0.6 };
    return { speedMult: 1.25, damageMult: 1.5, hpMult: 1.45, spawnSpeedMult: 0.5 };
  }

  // Lobs a flare from the bunker that illuminates the battlefield for a few seconds.
  public fireFlare() {
    if (this.gameState !== 'playing') return;
    // Launch outward in the aim direction
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
    const x = Math.sin(this.yaw) * 40;
    const z = Math.cos(this.yaw) * 40;
    const y = this.getHeightAt(x, z) + 18;
    const light = new THREE.PointLight(0xffe9b0, 3.2, 180, 1.6);
    light.position.set(x, y, z);
    this.scene.add(light);
    this.flareLights.push({ light, life: 0, maxLife: 5.0 });
    soundManager.playFlare();
    // small flare glow particle
    this.particles.push({
      x, y, z, vx: 0, vy: 0, vz: 0,
      color: '#fff2c0', size: 3.0, life: 0, maxLife: 5.0,
    });
    void dir;
  }

  private updateAtmosphere(dt: number) {
    // Ease dayNightT toward the target (0 day / 1 night)
    const target = this.isNight ? 1 : 0;
    this.dayNightT += (target - this.dayNightT) * dt * 0.8;

    const t = this.dayNightT;
    // Sky: bright blue -> deep night blue
    const skyDay = new THREE.Color(0x8cb5dc);
    const skyNight = new THREE.Color(0x0a1024);
    (this.scene.background as THREE.Color).copy(skyDay).lerp(skyNight, t);

    // Fog: light haze -> dark blue haze
    const fogDay = new THREE.Color(0x9ec0de);
    const fogNight = new THREE.Color(0x0a1230);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(fogDay).lerp(fogNight, t);

    // Lights
    this.sunLight.intensity = 1.6 * (1 - t) + 0.0 * t;
    this.sunLight.color.set(0xfffaed).lerp(new THREE.Color(0x8899bb), t);
    this.ambientLight.intensity = 0.85 * (1 - t) + 0.28 * t;
    this.ambientLight.color.set(0xdbe3ea).lerp(new THREE.Color(0x9fb0d0), t);
    this.fillLight.intensity = 0.6 * (1 - t) + 0.15 * t;

    // Renderer exposure slightly darker at night
    this.renderer.toneMappingExposure = 1.1 * (1 - t) + 0.85 * t;

    // Searchlight: only visible at night, follows the aim
    this.searchlight.intensity = t > 0.05 ? 6.0 * t : 0;
    this.searchlight.position.set(this.camera.position.x, this.camera.position.y - 0.4, this.camera.position.z);
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
    this.searchlightTarget.position.set(
      this.searchlight.position.x + dir.x * 80,
      this.searchlight.position.y + dir.y * 80,
      this.searchlight.position.z + dir.z * 80
    );

    // Update flares
    for (let i = this.flareLights.length - 1; i >= 0; i--) {
      const f = this.flareLights[i];
      f.life += dt;
      const k = Math.max(0, 1 - f.life / f.maxLife);
      f.light.intensity = 3.2 * k;
      if (f.life >= f.maxLife) {
        this.scene.remove(f.light);
        this.flareLights.splice(i, 1);
      }
    }
  }

  /* ================= ENEMY FACTORIES & SPAWNING ================= */
  public startWave(waveNum: number) {
    this.gameState = 'playing';
    this.stats.wave = waveNum;
    this.stats.difficulty = this.difficulty;
    // Night missions begin at wave 3 so players see the day/night change early.
    this.setNight(waveNum >= 3);

    const diff = DIFFICULTY_SETTINGS[this.difficulty];

    // Configure wave composition scaled by difficulty
    const baseSoldiers = 6 + waveNum * 3;
    const baseTanks = Math.floor(waveNum * 1.2);
    const baseAPCs = Math.floor(waveNum * 0.8) + (waveNum >= 2 ? 1 : 0);
    const baseHelis = Math.max(1, Math.floor(waveNum * 0.8));
    const baseAirborne = Math.max(1, Math.floor(waveNum * 0.7));
    // Jets & cargo planes appear early so they're actually experienced
    const baseJets = waveNum >= 3 ? Math.floor((waveNum - 1) * 0.6) : 0;
    const baseCargoPlanes = waveNum >= 3 ? Math.floor((waveNum - 1) * 0.4) : 0;

    const soldiersCount = Math.max(3, Math.round(baseSoldiers * diff.countMult));
    const tanksCount = Math.round(baseTanks * diff.countMult);
    const apcsCount = Math.max(waveNum >= 2 ? 1 : 0, Math.round(baseAPCs * diff.countMult));
    const helicoptersCount = Math.max(waveNum >= 2 ? 1 : 0, Math.round(baseHelis * diff.countMult));
    const airborneDropsCount = Math.max(1, Math.round(baseAirborne * diff.countMult));
    const jetsCount = Math.round(baseJets * diff.countMult);
    const cargoPlanesCount = Math.round(baseCargoPlanes * diff.countMult);

    this.currentWaveConfig = {
      waveNumber: waveNum,
      name: `Wave ${waveNum} - Mountain Assault (${this.difficulty.toUpperCase()})`,
      soldiersCount,
      tanksCount,
      apcsCount,
      helicoptersCount,
      airborneDropsCount,
      spawnIntervalMs: Math.round(diff.minSpawnInterval * 1000),
      difficulty: this.difficulty,
    };

    const totalEnemies = soldiersCount + tanksCount + apcsCount + helicoptersCount + airborneDropsCount + jetsCount + cargoPlanesCount;
    this.stats.totalWaveEnemies = totalEnemies;
    this.stats.remainingWaveEnemies = totalEnemies;
    this.stats.airstrikesAvailable = Math.min(3, (this.stats.airstrikesAvailable || 0) + 1);

    // Staggered Tactical Echelons (DO NOT deploy all at once!)
    // Echelon 1: Vanguard Scouts (Light reconnaissance squad & paratroopers)
    const ech1: EnemyType[] = [];
    const ech1Soldiers = Math.max(2, Math.floor(soldiersCount * 0.35));
    const ech1Airborne = Math.max(1, Math.floor(airborneDropsCount * 0.5));
    for (let i = 0; i < ech1Soldiers; i++) ech1.push('soldier');
    for (let i = 0; i < ech1Airborne; i++) ech1.push('paratrooper');
    if (apcsCount > 1 && waveNum >= 2) ech1.push('apc');
    this.shuffleArray(ech1);

    // Echelon 2: Armored Ground Column (Heavy tanks & APCs advancing under rifle fire)
    const ech2: EnemyType[] = [];
    const ech2Tanks = Math.max(tanksCount > 0 ? 1 : 0, Math.floor(tanksCount * 0.6));
    const ech2APCs = Math.max(apcsCount > 0 ? 1 : 0, Math.floor(apcsCount * 0.6));
    const ech2Soldiers = Math.max(2, Math.floor(soldiersCount * 0.35));
    for (let i = 0; i < ech2Tanks; i++) ech2.push('tank');
    for (let i = 0; i < ech2APCs; i++) ech2.push('apc');
    for (let i = 0; i < ech2Soldiers; i++) ech2.push('soldier');
    if (helicoptersCount > 1 && waveNum >= 3) ech2.push('helicopter');
    this.shuffleArray(ech2);

    // Echelon 3: Heavy Air Strike & Combined Assault (Gunships, remaining armor & infantry)
    const ech3: EnemyType[] = [];
    const remSoldiers = Math.max(0, soldiersCount - ech1Soldiers - ech2Soldiers);
    const remTanks = Math.max(0, tanksCount - ech2Tanks);
    const remAPCs = Math.max(0, apcsCount - (ech1.includes('apc') ? 1 : 0) - ech2APCs);
    const remHelis = Math.max(0, helicoptersCount - (ech2.includes('helicopter') ? 1 : 0));
    const remAirborne = Math.max(0, airborneDropsCount - ech1Airborne);

    for (let i = 0; i < remSoldiers; i++) ech3.push('soldier');
    for (let i = 0; i < remTanks; i++) ech3.push('tank');
    for (let i = 0; i < remAPCs; i++) ech3.push('apc');
    for (let i = 0; i < remHelis; i++) ech3.push('helicopter');
    for (let i = 0; i < remAirborne; i++) ech3.push('paratrooper');
    for (let i = 0; i < jetsCount; i++) ech3.push('jet');
    for (let i = 0; i < cargoPlanesCount; i++) ech3.push('transport_plane');
    this.shuffleArray(ech3);

    this.echelons = [
      { name: 'Vanguard Scouts', queue: ech1 },
      { name: 'Armored Column', queue: ech2 },
      { name: 'Heavy Air Strike', queue: ech3 },
    ];

    this.currentEchelonIndex = 0;
    this.stats.currentEchelon = 1;
    this.stats.totalEchelons = 3;
    this.lastSpawnTime = performance.now() - 3000;
    this.echelonPauseTimer = 0;
    this.waveClearTimer = 0;
    this.waveDamageTaken = false;

    soundManager.playWaveHorn();
    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
  }

  private spawnEnemy(type: EnemyType) {
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const ws = this.waveScale(this.stats.wave);
    const hpMult = diff.hpMult * ws.hpMult;
    let spawnX: number;
    let spawnZ: number;

    if (type === 'helicopter') {
      // Spawn near the rugged far rim so the player sees the gunship arrive
      // from the distant mountains before it closes in.
      const heliAngle = Math.random() * Math.PI * 2;
      const heliDist = 205 + Math.random() * 70;
      spawnX = Math.sin(heliAngle) * heliDist;
      spawnZ = Math.cos(heliAngle) * heliDist;
    } else if (type === 'soldier') {
      // Flanking mountain infantry squads advance from all surrounding sectors
      const soldierAngle = (Math.random() - 0.5) * 3.6;
      const dist = 150 + Math.random() * 55;
      spawnX = Math.sin(soldierAngle) * dist;
      spawnZ = Math.cos(soldierAngle) * dist;
    } else {
      // Heavy armor (Tanks & APCs) advance across the battlefield
      const angle = (Math.random() - 0.5) * 2.8;
      const distance = 165 + Math.random() * 45;
      spawnX = Math.sin(angle) * distance;
      spawnZ = Math.cos(angle) * distance;
    }
    const groundY = this.getHeightAt(spawnX, spawnZ);

    if (type === 'soldier') {
      const { group, leftLeg, rightLeg, rifle } = createSoldierModel();
      group.position.set(spawnX, groundY, spawnZ);
      group.lookAt(0, 0, 0);
      // slight body variation AROUND the model's native scale (1.85) so squads
      // don't look cloned AND soldiers stay full size (feet on the ground)
      const baseScale = 1.85 * (0.93 + Math.random() * 0.14);
      group.scale.set(baseScale, baseScale, baseScale);
      this.scene.add(group);

      const soldierHp = Math.round(20 * hpMult);
      const engageDist = 45 + Math.random() * 50; // engage from afar, don't storm the bunker
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'soldier',
        meshGroup: group,
        position: { x: spawnX, y: groundY, z: spawnZ },
        velocity: { x: 0, y: 0, z: 0 },
        hp: soldierHp,
        maxHp: soldierHp,
        speed: (3.4 + Math.random() * 1.0) * ws.speedMult,
        scoreValue: 75,
        hitRadius: 1.8,
        dead: false,
        state: 'advancing',
        stateTimer: 0,
        fireCooldown: (3.0 + Math.random() * 2.5) * diff.fireCooldownMult,
        lastFireTime: performance.now(),
        runCycleOffset: Math.random() * 10,
        turretMesh: leftLeg,
        cannonMesh: rightLeg,
        proneTimer: 0,
        prone: false,
        coverDir: Math.random() * Math.PI * 2,
        engageDist,
        baseScale,
      });

    } else if (type === 'apc') {
      const { group, turret, cannon, wheels } = createAPCModel();
      group.position.set(spawnX, groundY, spawnZ);
      group.lookAt(0, 0, 0);
      this.scene.add(group);

      const apcHp = Math.round((140 + this.stats.wave * 20) * hpMult);
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'apc',
        meshGroup: group,
        position: { x: spawnX, y: groundY, z: spawnZ },
        velocity: { x: 0, y: 0, z: 0 },
        hp: apcHp,
        maxHp: apcHp,
        speed: (4.4 + Math.random() * 0.8) * ws.speedMult,
        scoreValue: 280,
        hitRadius: 4.2,
        dead: false,
        state: 'advancing',
        stateTimer: 0,
        fireCooldown: (2.6 + Math.random() * 1.4) * diff.fireCooldownMult,
        lastFireTime: performance.now(),
        turretMesh: turret,
        cannonMesh: cannon,
        wheels,
        dropsLeft: 5 + Math.floor(this.stats.wave / 3), // APC troop package (5-8 troops)
      });

    } else if (type === 'tank') {
      const { group, turret, cannon, wheels } = createTankModel();
      group.position.set(spawnX, groundY, spawnZ);
      group.lookAt(0, 0, 0);
      this.scene.add(group);

      const tankHp = Math.round((220 + this.stats.wave * 30) * hpMult);
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'tank',
        meshGroup: group,
        position: { x: spawnX, y: groundY, z: spawnZ },
        velocity: { x: 0, y: 0, z: 0 },
        hp: tankHp,
        maxHp: tankHp,
        speed: (3.6 + Math.random() * 0.8) * ws.speedMult,
        scoreValue: 350,
        hitRadius: 4.6,
        dead: false,
        state: 'advancing',
        stateTimer: 0,
        fireCooldown: (4.0 + Math.random() * 1.8) * diff.fireCooldownMult,
        lastFireTime: performance.now(),
        turretMesh: turret,
        cannonMesh: cannon,
      });

    } else if (type === 'helicopter') {
      const { group, mainRotor, tailRotor } = createHelicopterModel();
      const heliAlt = 26 + Math.random() * 14;
      const spawnY = this.getHeightAt(spawnX, spawnZ) + heliAlt;
      group.position.set(spawnX, spawnY, spawnZ);
      group.lookAt(0, 7.0, 0);
      this.scene.add(group);

      const heliHp = Math.round((90 + this.stats.wave * 15) * hpMult);
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'helicopter',
        meshGroup: group,
        position: { x: spawnX, y: spawnY, z: spawnZ },
        velocity: { x: 0, y: 0, z: 0 },
        hp: heliHp,
        maxHp: heliHp,
        speed: (22 + Math.random() * 6) * ws.speedMult,
        scoreValue: 300,
        hitRadius: 4.8,
        dead: false,
        state: 'advancing',
        stateTimer: 0,
        fireCooldown: (3.0 + Math.random() * 1.5) * diff.fireCooldownMult,
        lastFireTime: performance.now(),
        mainRotorMesh: mainRotor,
        tailRotorMesh: tailRotor,
        dropsLeft: 2,
        strafeDir: Math.random() < 0.5 ? 1 : -1,
      });

    } else if (type === 'paratrooper') {
      const { group, soldierGroup, parachuteMesh } = createParatrooperModel();
      const dropAlt = 45 + Math.random() * 20;
      const dropAngle = Math.random() * Math.PI * 2;
      const dropDist = 32 + Math.random() * 55;
      const dropX = Math.sin(dropAngle) * dropDist;
      const dropZ = Math.cos(dropAngle) * dropDist;
      const landingY = this.getHeightAt(dropX, dropZ);

      group.position.set(dropX, landingY + dropAlt, dropZ);
      this.scene.add(group);
      soundManager.playParachuteChute();

      const paraHp = Math.round(20 * hpMult);
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'paratrooper',
        meshGroup: group,
        position: { x: dropX, y: landingY + dropAlt, z: dropZ },
        velocity: { x: (Math.random() - 0.5) * 0.8, y: -4.8, z: (Math.random() - 0.5) * 0.8 },
        hp: paraHp,
        maxHp: paraHp,
        speed: 5.5,
        scoreValue: 120,
        hitRadius: 3.2,
        dead: false,
        state: 'descending',
        stateTimer: 0,
        fireCooldown: 999,
        lastFireTime: 0,
        landingY,
        parachuteMesh,
      });
    } else if (type === 'jet') {
      // Enemy fighter jet: high-speed strafing pass across the battlefield
      const { group } = createEnemyJetModel();
      const jetAngle = Math.random() * Math.PI * 2;
      const jetDist = 260 + Math.random() * 60;
      const spawnX = Math.sin(jetAngle) * jetDist;
      const spawnZ = Math.cos(jetAngle) * jetDist;
      const jetAlt = 45 + Math.random() * 20;
      group.position.set(spawnX, jetAlt, spawnZ);
      group.lookAt(0, jetAlt, 0);
      this.scene.add(group);

      const jetHp = Math.round(75 * hpMult);
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'jet',
        meshGroup: group,
        position: { x: spawnX, y: jetAlt, z: spawnZ },
        velocity: { x: 0, y: 0, z: 0 },
        hp: jetHp,
        maxHp: jetHp,
        speed: (55 + Math.random() * 15) * ws.speedMult,
        scoreValue: 300,
        hitRadius: 4.5,
        dead: false,
        state: 'advancing',
        stateTimer: 0,
        fireCooldown: 1.4,
        lastFireTime: performance.now(),
        strafePhase: 'approach',
        burstLeft: 0,
        burstTimer: 0,
      });
    } else if (type === 'transport_plane') {
      // Cargo plane: slow high flyover dropping paratroopers in a line
      const { group } = createTransportPlaneModel();
      const planeAngle = Math.random() * Math.PI * 2;
      const planeDist = 200 + Math.random() * 40;
      const spawnX = Math.sin(planeAngle) * planeDist;
      const spawnZ = Math.cos(planeAngle) * planeDist;
      const planeAlt = 70 + Math.random() * 15;
      group.position.set(spawnX, planeAlt, spawnZ);
      group.lookAt(0, planeAlt, 0);
      this.scene.add(group);

      const planeHp = Math.round(100 * hpMult);
      this.enemies.push({
        id: this.nextEntityId++,
        type: 'transport_plane',
        meshGroup: group,
        position: { x: spawnX, y: planeAlt, z: spawnZ },
        velocity: { x: 0, y: 0, z: 0 },
        hp: planeHp,
        maxHp: planeHp,
        speed: (20 + Math.random() * 5) * ws.speedMult,
        scoreValue: 200,
        hitRadius: 7.0,
        dead: false,
        state: 'advancing',
        stateTimer: 0,
        fireCooldown: 999,
        lastFireTime: 0,
        dropsTotal: 7 + Math.floor(Math.random() * 4), // heavy airborne drop (7-10 paras)
        dropInterval: 0.45,
        lastDropTime: performance.now() - 500,
      });
    }
  }

  /* ================= SIMULATION & TICK ================= */
  private updateSpawning(dt: number) {
    if (this.gameState !== 'playing') return;

    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const aliveEnemies = this.enemies.filter((e) => !e.dead);
    const queuedCount = this.echelons.reduce((sum, ech) => sum + ech.queue.length, 0);

    this.stats.activeThreats = aliveEnemies.length;
    this.stats.remainingWaveEnemies = aliveEnemies.length + queuedCount;

    const now = performance.now();
    const currentEch = this.echelons[this.currentEchelonIndex];

    if (currentEch && currentEch.queue.length > 0) {
      // Don't deploy all at once:
      // 1. Concurrency limit: Do not spawn if battlefield already has maxConcurrent alive enemies
      // 2. Interval pacing: Wait at least minSpawnInterval seconds between unit deployments
      if (aliveEnemies.length < diff.maxConcurrent) {
        if ((now - this.lastSpawnTime) / 1000 >= diff.minSpawnInterval) {
          const nextType = currentEch.queue.shift();
          if (nextType) {
            this.spawnEnemy(nextType);
            this.lastSpawnTime = now;
            if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
          }
        }
      }
    } else if (this.currentEchelonIndex < this.echelons.length - 1) {
      // Current echelon queue is empty.
      // Transition to next echelon when active units are down to <= 2
      // OR after subWavePause breather has elapsed.
      this.echelonPauseTimer += dt;
      if (aliveEnemies.length <= 2 || this.echelonPauseTimer >= diff.subWavePause) {
        this.currentEchelonIndex++;
        this.stats.currentEchelon = this.currentEchelonIndex + 1;
        this.echelonPauseTimer = 0;
        this.lastSpawnTime = now - (diff.minSpawnInterval * 1000 - 600); // prompt initial spawn of next squad
        soundManager.playWaveHorn();
        if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
      }
    } else {
      // All echelons deployed and their queues emptied!
      if (aliveEnemies.length === 0) {
        this.waveClearTimer += dt;
        if (this.waveClearTimer > 1.8) {
          this.clearWave();
        }
      } else {
        this.waveClearTimer = 0;
      }
    }
  }

  private clearWave() {
    this.gameState = 'wave_cleared';
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const heal = Math.min(diff.waveClearHeal, this.stats.maxBaseHealth - this.stats.baseHealth);
    this.stats.baseHealth += heal;
    this.stats.score += this.stats.wave * 500;

    // Perfect-wave bonus: no damage taken this wave → +200 and ×2 wave score
    if (!this.waveDamageTaken) {
      this.stats.score += 200 + this.stats.wave * 500;
      this.addFloater(0, 10, -20, 'PERFECT WAVE +' + (200 + this.stats.wave * 500), '#7dff9e');
    }

    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
    if (this.onWaveComplete) this.onWaveComplete(this.stats.wave);
  }

  private updateEnemies(dt: number) {
    let activeHelis = 0;

    for (const e of this.enemies) {
      if (e.dead) continue;

      if (e.type === 'soldier') {
        const diff = DIFFICULTY_SETTINGS[this.difficulty];
        const toPlayer = new THREE.Vector3(-e.position.x, 0, -e.position.z);
        const dist = toPlayer.length();
        const engageDist = e.engageDist || 50;

        if (e.prone) {
          // Soldier is kneeling at a far engagement position (taking cover).
          // Keep the feet planted ON the terrain (never sink below it).
          const bs = e.baseScale || 1.85;
          e.meshGroup.scale.set(bs, bs * 0.6, bs); // squat/kneel pose, origin at feet
          e.meshGroup.position.set(e.position.x, e.position.y + 0.18, e.position.z);
          e.meshGroup.lookAt(0, e.position.y + 0.8, 0);
          // very occasional slow crawl around cover
          if (dist > engageDist + 8) {
            e.prone = false;
            e.state = 'advancing';
            e.meshGroup.scale.set(bs, bs, bs);
          } else {
            // slight random sidestep crawl
            if (Math.random() < dt * 0.5) {
              e.coverDir = (e.coverDir || 0) + (Math.random() - 0.5) * 1.6;
              const sd = Math.sin(e.coverDir || 0) * e.speed * 0.4 * dt;
              const cd = Math.cos(e.coverDir || 0) * e.speed * 0.4 * dt;
              e.position.x += sd; e.position.z += cd;
              e.position.y = this.getHeightAt(e.position.x, e.position.z);
            }
          }
        } else if (e.state === 'advancing') {
          const bs = e.baseScale || 1.85;
          e.meshGroup.scale.set(bs, bs, bs);
          // Advance until reaching the engagement distance, then go prone
          if (dist > engageDist) {
            toPlayer.normalize();
            e.position.x += toPlayer.x * e.speed * dt;
            e.position.z += toPlayer.z * e.speed * dt;
            e.position.y = this.getHeightAt(e.position.x, e.position.z);
            // Leg running animation
            e.runCycleOffset = (e.runCycleOffset || 0) + dt * 10;
            if (e.turretMesh && e.cannonMesh) {
              e.turretMesh.rotation.x = Math.sin(e.runCycleOffset) * 0.7;
              e.cannonMesh.rotation.x = -Math.sin(e.runCycleOffset) * 0.7;
            }
            e.meshGroup.position.set(e.position.x, e.position.y + 0.18, e.position.z);
            e.meshGroup.lookAt(0, e.position.y + 1.0, 0);
          } else {
            // Reached engagement range: take cover / go prone
            e.state = 'firing';
            e.prone = Math.random() < 0.7; // most drop prone, some kneel
            e.proneTimer = 4 + Math.random() * 6;
            e.coverDir = Math.random() * Math.PI * 2;
            e.fireCooldown = (1.2 + Math.random() * 1.5) * diff.fireCooldownMult;
          }
        } else {
          // Firing phase (prone or kneeling) — do not storm the bunker.
          // Feet stay planted at the terrain line; only the body height changes.
          e.proneTimer = Math.max(0, (e.proneTimer || 0) - dt);
          const bs = e.baseScale || 1.85;
          if (e.proneTimer < 1.2) {
            // pop up to kneel and shoot
            e.meshGroup.scale.set(bs, bs * 0.75, bs);
            e.meshGroup.position.set(e.position.x, e.position.y + 0.18, e.position.z);
          } else {
            // ducked down (kneeling) behind cover
            e.meshGroup.scale.set(bs, bs * 0.55, bs);
            e.meshGroup.position.set(e.position.x, e.position.y + 0.18, e.position.z);
          }
          e.meshGroup.lookAt(0, e.position.y + 0.8, 0);
        }

        // Only fire when within engagement range & while in firing state
        if (e.state === 'firing' && dist <= engageDist + 10) {
          if (performance.now() - e.lastFireTime > e.fireCooldown * 1000) {
            e.lastFireTime = performance.now();
            this.enemyShootRifle(e);
          }
        }

      } else if (e.type === 'tank') {
        // Tank rolling down the battlefield plain — halts in the far zone and shells the bunker
        const toPlayer = new THREE.Vector3(-e.position.x, 0, -e.position.z);
        const dist = toPlayer.length();
        const tankStopDist = 60 + Math.random() * 35;

        if (dist > tankStopDist) {
          toPlayer.normalize();
          e.position.x += toPlayer.x * e.speed * dt;
          e.position.z += toPlayer.z * e.speed * dt;
          e.position.y = this.getHeightAt(e.position.x, e.position.z);

          // Kick up dust
          if (Math.random() < 0.35) {
            this.particles.push({
              x: e.position.x + (Math.random() - 0.5) * 3,
              y: e.position.y + 0.4,
              z: e.position.z + (Math.random() - 0.5) * 3,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 0.5 + Math.random() * 1.0,
              vz: (Math.random() - 0.5) * 1.5,
              color: '#8c7e6b',
              size: 1.5 + Math.random() * 1.8,
              life: 0,
              maxLife: 0.8,
              smoke: true,
            });
          }
        }

        e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);
        e.meshGroup.lookAt(0, e.position.y, 0);

        // Tank main gun firing at mountain redoubt
        if (performance.now() - e.lastFireTime > e.fireCooldown * 1000) {
          e.lastFireTime = performance.now();
          this.enemyShootTankCannon(e);
        }

      } else if (e.type === 'apc') {
        // 8-Wheeled Armored Personnel Carrier advancing down plain
        const toPlayer = new THREE.Vector3(-e.position.x, 0, -e.position.z);
        const dist = toPlayer.length();

        if (dist > 55) {
          toPlayer.normalize();
          e.position.x += toPlayer.x * e.speed * dt;
          e.position.z += toPlayer.z * e.speed * dt;
          e.position.y = this.getHeightAt(e.position.x, e.position.z);

          // Rotate 8 tires
          if (e.wheels) {
            for (const w of e.wheels) {
              w.rotation.x += dt * 6.0;
            }
          }

          if (Math.random() < 0.3) {
            this.particles.push({
              x: e.position.x + (Math.random() - 0.5) * 2.5,
              y: e.position.y + 0.3,
              z: e.position.z + (Math.random() - 0.5) * 2.5,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 0.4 + Math.random() * 0.8,
              vz: (Math.random() - 0.5) * 1.5,
              color: '#8c7e6b',
              size: 1.2 + Math.random() * 1.4,
              life: 0,
              maxLife: 0.7,
              smoke: true,
            });
          }
        } else if (e.dropsLeft && e.dropsLeft > 0) {
          // APC halts at the perimeter and deploys its troop package one by one
          if ((e.lastDropTime || 0) > 0 && performance.now() - e.lastDropTime < 500) {
            // still exiting the previous troop — pause
          } else {
            e.lastDropTime = performance.now();
            e.dropsLeft--;
            const { group, leftLeg, rightLeg } = createSoldierModel();
            const depX = e.position.x + (Math.random() - 0.5) * 6;
            const depZ = e.position.z + (Math.random() - 0.5) * 6;
            const depY = this.getHeightAt(depX, depZ);
            group.position.set(depX, depY, depZ);
            this.scene.add(group);

          const diff = DIFFICULTY_SETTINGS[this.difficulty];
          const soldierHp = Math.round(20 * diff.hpMult);
          this.enemies.push({
            id: this.nextEntityId++,
            type: 'soldier',
            meshGroup: group,
            position: { x: depX, y: depY, z: depZ },
            velocity: { x: 0, y: 0, z: 0 },
            hp: soldierHp,
            maxHp: soldierHp,
            speed: 3.6 + Math.random() * 0.8,
            scoreValue: 75,
            hitRadius: 1.8,
            dead: false,
            state: 'advancing',
            stateTimer: 0,
            fireCooldown: 2.8 * diff.fireCooldownMult,
            lastFireTime: performance.now(),
            turretMesh: leftLeg,
            cannonMesh: rightLeg,
            proneTimer: 0,
            prone: false,
            coverDir: Math.random() * Math.PI * 2,
            engageDist: 40 + Math.random() * 45,
          });
          }
        }

        e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);
        e.meshGroup.lookAt(0, e.position.y, 0);

        // APC 30mm autocannon bursts
        if (performance.now() - e.lastFireTime > e.fireCooldown * 1000) {
          e.lastFireTime = performance.now();
          this.enemyShootAPCCannon(e);
        }

      } else if (e.type === 'helicopter') {
        activeHelis++;
        // Spin main and tail rotors
        if (e.mainRotorMesh) e.mainRotorMesh.rotation.y += dt * 35;
        if (e.tailRotorMesh) e.tailRotorMesh.rotation.x += dt * 50;

        if (e.state === 'advancing') {
          // Fly in a straight line toward the battlefield, descending slightly.
          const toPlayer = new THREE.Vector3(-e.position.x, 0, -e.position.z);
          const dist = toPlayer.length();
          toPlayer.normalize();
          e.position.x += toPlayer.x * e.speed * dt;
          e.position.z += toPlayer.z * e.speed * dt;
          // Ease altitude down from approach height toward attack altitude (~20m)
          e.position.y += (20 - e.position.y) * dt * 0.35;
          e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);
          e.meshGroup.lookAt(0, 7.0, 0);

          // Once close enough, begin the attack orbit
          if (dist <= 95) {
            e.state = 'circling';
            e.stateTimer = 0;
          }
        } else {
          // Fly swoop / circle around mountain pass
          e.stateTimer += dt;
          const orbitAngle = e.stateTimer * 0.3 * (e.strafeDir || 1);
          const orbitRadius = 62 + Math.sin(e.stateTimer * 0.5) * 22;
          e.position.x = Math.sin(orbitAngle) * orbitRadius;
          e.position.z = Math.cos(orbitAngle) * orbitRadius;
          e.position.y = 21 + Math.sin(e.stateTimer * 0.8) * 6;
          e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);
          e.meshGroup.lookAt(0, 7.0, 0);

          // Drop paratroopers occasionally (attack phase only)
          if (e.dropsLeft && e.dropsLeft > 0 && Math.random() < 0.005) {
            e.dropsLeft--;
            this.spawnEnemy('paratrooper');
          }
        }

        // Fire helicopter rockets (only once it's engaged, not during approach)
        if (e.state === 'circling' && performance.now() - e.lastFireTime > e.fireCooldown * 1000) {
          e.lastFireTime = performance.now();
          this.enemyShootHeliRocket(e);
        }

      } else if (e.type === 'paratrooper') {
        // Descend with parachute
        e.position.y += e.velocity.y * dt;
        e.position.x += e.velocity.x * dt;
        e.position.z += e.velocity.z * dt;

        // Sway in mountain wind
        e.stateTimer += dt;
        e.meshGroup.rotation.z = Math.sin(e.stateTimer * 2.5) * 0.15;
        e.meshGroup.rotation.x = Math.cos(e.stateTimer * 2.0) * 0.12;

        e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);

        // Touchdown on mountain terrain
        if (e.position.y <= (e.landingY || 0) + 0.2) {
          // Transform into ground soldier!
          e.dead = true;
          this.scene.remove(e.meshGroup);
          // Spawn grounded soldier at touchdown position
          const { group } = createSoldierModel();
          group.position.set(e.position.x, e.landingY || 0, e.position.z);
          this.scene.add(group);

          const diff = DIFFICULTY_SETTINGS[this.difficulty];
          const soldierHp = Math.round(20 * diff.hpMult);
          this.enemies.push({
            id: this.nextEntityId++,
            type: 'soldier',
            meshGroup: group,
            position: { x: e.position.x, y: e.landingY || 0, z: e.position.z },
            velocity: { x: 0, y: 0, z: 0 },
            hp: soldierHp,
            maxHp: soldierHp,
            speed: 3.4,
            scoreValue: 75,
            hitRadius: 1.8,
            dead: false,
            state: 'advancing',
            stateTimer: 0,
            fireCooldown: 3.0 * diff.fireCooldownMult,
            lastFireTime: performance.now(),
            proneTimer: 0,
            prone: false,
            coverDir: Math.random() * Math.PI * 2,
            engageDist: 40 + Math.random() * 55,
          });
        }
      } else if (e.type === 'jet') {
        // Enemy fighter: fast straight strafing pass over the battlefield
        const toPlayer = new THREE.Vector3(-e.position.x, 0, -e.position.z);
        const dist = toPlayer.length();
        toPlayer.normalize();

        // Fly toward the battlefield, keep altitude
        e.position.x += toPlayer.x * e.speed * dt;
        e.position.z += toPlayer.z * e.speed * dt;
        e.position.y = e.position.y; // maintain altitude
        e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);
        e.meshGroup.lookAt(e.position.x + toPlayer.x * 10, e.position.y, e.position.z + toPlayer.z * 10);

        // Strafe-fire bursts when within firing range, then exit
        if (e.strafePhase === 'approach' && dist < 140) {
          e.strafePhase = 'pass';
          e.burstLeft = 6;
        }

        if (e.strafePhase === 'pass') {
          e.burstTimer = (e.burstTimer || 0) + dt;
          if ((e.burstLeft || 0) > 0 && e.burstTimer > 0.06) {
            e.burstTimer = 0;
            e.burstLeft = (e.burstLeft || 1) - 1;
            this.enemyShootJetGun(e);
          }
          if (dist < 8) e.strafePhase = 'exit';
        }

        // Exit: once well past the battlefield, despawn
        if (e.strafePhase === 'exit' && dist > 240) {
          e.dead = true;
          this.scene.remove(e.meshGroup);
        }

      } else if (e.type === 'transport_plane') {
        // Cargo plane: slow, high flyover dropping paratroopers in sequence
        const toPlayer = new THREE.Vector3(-e.position.x, 0, -e.position.z);
        const dist = toPlayer.length();
        toPlayer.normalize();
        e.position.x += toPlayer.x * e.speed * dt;
        e.position.z += toPlayer.z * e.speed * dt;
        e.meshGroup.position.set(e.position.x, e.position.y, e.position.z);
        e.meshGroup.lookAt(e.position.x + toPlayer.x * 10, e.position.y, e.position.z + toPlayer.z * 10);

        // Drop paratroopers in a trailing line as it crosses the field
        if ((e.dropsTotal || 0) > 0 && dist < 130 && performance.now() - (e.lastDropTime || 0) > (e.dropInterval || 0.7) * 1000) {
          e.lastDropTime = performance.now();
          e.dropsTotal = (e.dropsTotal || 1) - 1;
          this.dropParatrooperAt(e.position.x, e.position.y, e.position.z);
        }

        // Despawn after crossing the far side
        if (dist > 240) {
          e.dead = true;
          this.scene.remove(e.meshGroup);
        }
      }
    }

    soundManager.updateHelicopters(activeHelis);
  }

  /* ================= ENEMY WEAPONS ================= */
  private enemyShootRifle(e: EnemyEntity) {
    soundManager.playEnemyRifle();
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const spread = diff.accuracySpread;
    const origin = new THREE.Vector3(e.position.x, e.position.y + 1.2, e.position.z);
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      9.5 + (Math.random() - 0.5) * (spread * 0.4),
      (Math.random() - 0.5) * spread
    );
    const dir = target.sub(origin).normalize();

    this.spawnEnemyProjectile('enemy_bullet', origin, dir, 85, Math.max(1, Math.round(4 * diff.damageMult * this.waveScale(this.stats.wave).damageMult)));
  }

  private enemyShootTankCannon(e: EnemyEntity) {
    soundManager.playTankShot();
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const spread = diff.accuracySpread * 0.9;
    const origin = new THREE.Vector3(e.position.x, e.position.y + 2.0, e.position.z);
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      9.5 + (Math.random() - 0.5) * (spread * 0.3),
      (Math.random() - 0.5) * spread
    );
    const dir = target.sub(origin).normalize();

    this.spawnEnemyProjectile('enemy_shell', origin, dir, 70, Math.max(5, Math.round(18 * diff.damageMult * this.waveScale(this.stats.wave).damageMult)));
  }

  private enemyShootAPCCannon(e: EnemyEntity) {
    soundManager.playEnemyRifle();
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const spread = diff.accuracySpread * 1.1;
    const origin = new THREE.Vector3(e.position.x, e.position.y + 1.8, e.position.z);
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      9.5 + (Math.random() - 0.5) * (spread * 0.3),
      (Math.random() - 0.5) * spread
    );
    const dir = target.sub(origin).normalize();

    this.spawnEnemyProjectile('enemy_bullet', origin, dir, 90, Math.max(2, Math.round(6 * diff.damageMult * this.waveScale(this.stats.wave).damageMult)));
  }

  private enemyShootHeliRocket(e: EnemyEntity) {
    soundManager.playMissileLaunch();
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const spread = diff.accuracySpread * 1.2;
    const origin = new THREE.Vector3(e.position.x, e.position.y - 0.5, e.position.z);
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      9.5 + (Math.random() - 0.5) * (spread * 0.3),
      (Math.random() - 0.5) * spread
    );
    const dir = target.sub(origin).normalize();

    this.spawnEnemyProjectile('enemy_rocket', origin, dir, 65, Math.max(4, Math.round(14 * diff.damageMult * this.waveScale(this.stats.wave).damageMult)));
  }

  private enemyShootJetGun(e: EnemyEntity) {
    soundManager.playEnemyRifle();
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const spread = diff.accuracySpread * 0.8;
    const origin = new THREE.Vector3(e.position.x, e.position.y - 0.5, e.position.z);
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      9.5 + (Math.random() - 0.5) * (spread * 0.2),
      (Math.random() - 0.5) * spread
    );
    const dir = target.sub(origin).normalize();
    this.spawnEnemyProjectile('enemy_bullet', origin, dir, 140, Math.max(2, Math.round(5 * diff.damageMult * this.waveScale(this.stats.wave).damageMult)));
  }

  // Drop a paratrooper at a specific world position (cargo-plane tail drop)
  private dropParatrooperAt(x: number, y: number, z: number) {
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    const { group, parachuteMesh } = createParatrooperModel();
    const landingY = this.getHeightAt(x, z);
    group.position.set(x, y - 2, z);
    this.scene.add(group);
    soundManager.playParachuteChute();

    const paraHp = Math.round(20 * diff.hpMult);
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'paratrooper',
      meshGroup: group,
      position: { x, y: y - 2, z },
      velocity: { x: (Math.random() - 0.5) * 0.6, y: -3.6, z: (Math.random() - 0.5) * 0.6 },
      hp: paraHp,
      maxHp: paraHp,
      speed: 5.5,
      scoreValue: 75,
      hitRadius: 3.2,
      dead: false,
      state: 'descending',
      stateTimer: 0,
      fireCooldown: 999,
      lastFireTime: 0,
      landingY,
      parachuteMesh,
    });
  }

  private spawnEnemyProjectile(
    type: 'enemy_bullet' | 'enemy_shell' | 'enemy_rocket',
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage: number
  ) {
    let mesh: THREE.Mesh;
    if (type === 'enemy_bullet') {
      const geo = new THREE.SphereGeometry(0.12, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff3322 });
      mesh = new THREE.Mesh(geo, mat);
    } else {
      const geo = new THREE.SphereGeometry(0.35, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
      mesh = new THREE.Mesh(geo, mat);
    }

    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      type,
      mesh,
      position: { x: origin.x, y: origin.y, z: origin.z },
      velocity: { x: direction.x * speed, y: direction.y * speed, z: direction.z * speed },
      damage,
      splashRadius: 2.0,
      lifetime: 0,
      maxLifetime: 3.5,
      // Tank shells are interceptable: M60 can shoot them down (1 hit)
      hp: type === 'enemy_shell' ? 1 : undefined,
    });
  }

  /* ================= PROJECTILE SIMULATION & COLLISIONS ================= */
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime += dt;

      // Homing logic (missiles + kamikaze drone steer to target)
      if ((p.type === 'player_missile' || p.type === 'player_drone') && p.targetId) {
        const target = this.enemies.find((e) => e.id === p.targetId && !e.dead);
        if (target) {
          const toTarget = new THREE.Vector3(target.position.x - p.position.x, target.position.y - p.position.y, target.position.z - p.position.z).normalize();
          const speed = p.type === 'player_drone' ? 60 : 110;
          p.velocity.x = THREE.MathUtils.lerp(p.velocity.x, toTarget.x * speed, dt * 4);
          p.velocity.y = THREE.MathUtils.lerp(p.velocity.y, toTarget.y * speed, dt * 4);
          p.velocity.z = THREE.MathUtils.lerp(p.velocity.z, toTarget.z * speed, dt * 4);
          p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), toTarget);
        }
      }

      // Smoke trail (missiles + drone)
      if (p.type === 'player_missile' || p.type === 'enemy_rocket' || p.type === 'player_drone') {
        this.particles.push({
          x: p.position.x,
          y: p.position.y,
          z: p.position.z,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 0.5 + Math.random() * 0.8,
          vz: (Math.random() - 0.5) * 1.5,
          color: '#dddddd',
          size: 0.9,
          life: 0,
          maxLife: 0.6,
          smoke: true,
        });
        // Drone leaves a hot exhaust glow too
        if (p.type === 'player_drone') {
          this.particles.push({
            x: p.position.x, y: p.position.y, z: p.position.z,
            vx: 0, vy: 0, vz: 0, color: '#ff9a2e', size: 1.6, life: 0, maxLife: 0.18,
          });
        }
      }

      // Sub-stepped movement: fast player rounds (220 m/s) move ~3.7m per frame,
      // more than a soldier's ~2.3m effective hit radius, so a single per-frame
      // distance check lets rounds tunnel straight through targets. Splitting the
      // frame into small steps (~0.9m each) makes every target checkable.
      const moveDist = Math.hypot(p.velocity.x, p.velocity.y, p.velocity.z) * dt;
      const subSteps = p.type.startsWith('player_') ? THREE.MathUtils.clamp(Math.ceil(moveDist / 0.9), 1, 12) : 1;
      const sdt = dt / subSteps;

      let hit = false;
      for (let s = 0; s < subSteps && !hit; s++) {
        // Move projectile
        p.position.x += p.velocity.x * sdt;
        p.position.y += p.velocity.y * sdt;
        p.position.z += p.velocity.z * sdt;
        p.mesh.position.set(p.position.x, p.position.y, p.position.z);

        // Check Player Projectiles vs Enemies
        if (p.type.startsWith('player_')) {
          for (const e of this.enemies) {
            if (e.dead) continue;
            const dist = Math.hypot(p.position.x - e.position.x, p.position.y - e.position.y, p.position.z - e.position.z);

            if (dist <= e.hitRadius + p.splashRadius * 0.5) {
              hit = true;
              this.stats.shotsHit++;
              if (p.type === 'player_drone') {
                // Drone detonates: kill the target + splash everything nearby
                this.detonateDrone(p);
                break;
              }
              const crit = this.computeCrit(e, p.position);
              this.damageEnemy(e, p.damage * (crit === 'head' ? 1.5 : crit === 'rotor' ? 3.0 : crit === 'treads' ? 1.2 : 1.0), p.position, crit);
              break;
            }
          }

          // Check Player Projectiles vs interceptable enemy shells (tank shells)
          if (!hit) {
            for (let k = this.projectiles.length - 1; k >= 0; k--) {
              const ep = this.projectiles[k];
              if (ep === p || ep.type !== 'enemy_shell' || ep.hp === undefined || ep.hp <= 0) continue;
              const d2 = Math.hypot(p.position.x - ep.position.x, p.position.y - ep.position.y, p.position.z - ep.position.z);
              if (d2 < 1.2) {
                ep.hp = 0;
                hit = true;
                this.stats.shotsHit++;
                this.stats.score += 50;
                this.addFloater(ep.position.x, ep.position.y, ep.position.z, 'SHELL DOWN +50', '#7dd8ff');
                this.createExplosion(ep.position.x, ep.position.y, ep.position.z, 'small');
                // Remove the intercepted shell
                this.scene.remove(ep.mesh);
                this.projectiles.splice(k, 1);
                break;
              }
            }
          }

          // Terrain impact
          if (!hit) {
            const ground = this.getHeightAt(p.position.x, p.position.z);
            if (p.position.y <= ground) {
              hit = true;
              if (p.type === 'player_drone') {
                this.detonateDrone(p);
              } else {
                this.createExplosion(p.position.x, ground + 0.2, p.position.z, 'small');
              }
            }
          }

        } else {
          // Check Enemy Projectiles vs Player Bunker Redoubt at (0, 7.0, 0)
          const distToBunker = Math.hypot(p.position.x, p.position.y - 9.5, p.position.z);
          if (distToBunker < 4.5) {
            hit = true;
            this.damagePlayerBase(p.damage);
          }
        }
      }

      if (p.type === 'player_drone' && !hit && p.lifetime >= p.maxLifetime) {
        this.detonateDrone(p);
        hit = true;
      }

      if (hit || p.lifetime >= p.maxLifetime) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }
    }
  }

  private computeCrit(e: EnemyEntity, hitPos: { x: number; y: number; z: number }): 'none' | 'head' | 'rotor' | 'treads' {
    const dy = hitPos.y - e.position.y;
    if (e.type === 'soldier' || e.type === 'paratrooper') {
      // Head is the top ~0.35m of a ~2m tall model (scaled)
      return dy > 1.55 ? 'head' : 'none';
    }
    if (e.type === 'helicopter') {
      // Rotor is above the body
      return dy > 3.0 ? 'rotor' : 'none';
    }
    if (e.type === 'tank' || e.type === 'apc') {
      // Treads are low (near ground)
      return dy < 0.7 ? 'treads' : 'none';
    }
    return 'none';
  }

  private damageEnemy(e: EnemyEntity, damage: number, hitPos: { x: number; y: number; z: number }, crit: 'none' | 'head' | 'rotor' | 'treads' = 'none') {
    e.hp -= damage;

    // Sparks on hit
    for (let s = 0; s < 5; s++) {
      this.particles.push({
        x: hitPos.x,
        y: hitPos.y,
        z: hitPos.z,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        vz: (Math.random() - 0.5) * 6,
        color: '#ffee44',
        size: 0.4,
        life: 0,
        maxLife: 0.25,
      });
    }

    if (e.hp <= 0) {
      e.dead = true;
      this.scene.remove(e.meshGroup);

      // Track kills and score
      this.stats.score += e.scoreValue;
      // Headshot / rotor crit bonus (extra points for skillful hits)
      if (crit === 'head') {
        this.stats.score += 25;
        this.addFloater(e.position.x, e.position.y + 1.2, e.position.z, 'HEADSHOT +25', '#ffd23c');
      } else if (crit === 'rotor') {
        this.stats.score += 50;
        this.addFloater(e.position.x, e.position.y + 1.2, e.position.z, 'ROTOR HIT +50', '#ffd23c');
      } else if (crit === 'treads') {
        this.stats.score += 20;
        this.addFloater(e.position.x, e.position.y + 0.8, e.position.z, 'TREADS +20', '#ffd23c');
      }
      if (e.type === 'soldier') this.stats.kills.soldiers++;
      if (e.type === 'tank') this.stats.kills.tanks++;
      if (e.type === 'apc') this.stats.kills.apcs++;
      if (e.type === 'helicopter') this.stats.kills.helicopters++;
      if (e.type === 'paratrooper') this.stats.kills.paratroopers++;

      const queuedEnemies = this.echelons.reduce((sum, ech) => sum + ech.queue.length, 0);
      this.stats.remainingWaveEnemies = Math.max(0, this.enemies.filter((en) => !en.dead).length + queuedEnemies);

      const explosionSize = e.type === 'tank' || e.type === 'helicopter' || e.type === 'apc' || e.type === 'jet' || e.type === 'transport_plane' ? 'large' : 'medium';
      this.createExplosion(e.position.x, e.position.y, e.position.z, explosionSize);

      if (this.onStatsUpdate) this.onStatsUpdate(this.stats);
    }
  }

  private addFloater(x: number, y: number, z: number, text: string, color: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 34px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(text, 128, 32);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(2.2, 0.55, 1);
    this.scene.add(sprite);
    this.floaters.push({ sprite, life: 0, maxLife: 1.2 });
  }

  // Kamikaze drone detonation: big explosion + area damage to all enemies in range.
  private detonateDrone(p: ProjectileEntity) {
    const px = p.position.x, py = p.position.y, pz = p.position.z;
    this.createExplosion(px, py, pz, 'large');
    // area damage
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.position.x - px, e.position.y - py, e.position.z - pz);
      if (d <= p.splashRadius) {
        this.damageEnemy(e, p.damage, { x: e.position.x, y: e.position.y, z: e.position.z }, 'none');
      }
    }
  }

  private updateFloaters(dt: number) {    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life += dt;
      f.sprite.position.y += dt * 2.2;
      const mat = f.sprite.material as THREE.SpriteMaterial;
      mat.opacity = Math.max(0, 1 - f.life / f.maxLife);
      if (f.life >= f.maxLife) {
        this.scene.remove(f.sprite);
        mat.map?.dispose();
        mat.dispose();
        this.floaters.splice(i, 1);
      }
    }
  }

  private damagePlayerBase(dmg: number) {
    this.stats.baseHealth = Math.max(0, this.stats.baseHealth - dmg);
    this.waveDamageTaken = true;
    soundManager.playHitBase();
    this.screenShake = Math.min(1.0, this.screenShake + 0.45);

    if (this.onStatsUpdate) this.onStatsUpdate(this.stats);

    if (this.stats.baseHealth <= 0 && this.gameState !== 'game_over') {
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.gameState = 'game_over';
    soundManager.playExplosion('large');
    this.createExplosion(0, 1.8, 0, 'large');
    // Persist high score
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      GameEngine.saveHighScore(this.stats.highScore);
    }
    if (this.onGameOver) this.onGameOver(this.stats);
  }

  private createExplosion(x: number, y: number, z: number, size: 'small' | 'medium' | 'large') {
    soundManager.playExplosion(size);
    const scaleMult = size === 'large' ? 1 : size === 'medium' ? 0.7 : 0.45;
    const count = size === 'large' ? 42 : size === 'medium' ? 24 : 12;
    const speedBase = (size === 'large' ? 12 : 6);

    // Bright expanding fireball core (additive glow layer)
    for (let i = 0; i < count; i++) {
      const speed = speedBase * (0.5 + Math.random() * 0.8);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const fire = Math.random();
      this.particles.push({
        x, y, z,
        vx: Math.sin(phi) * Math.cos(theta) * speed * 0.55,
        vy: Math.abs(Math.cos(phi)) * speed * 0.55 + 1.0,
        vz: Math.sin(phi) * Math.sin(theta) * speed * 0.55,
        color: fire < 0.35 ? '#fff2a0' : fire < 0.7 ? '#ff9a2e' : '#ff4813',
        size: (size === 'large' ? 3.2 : 1.6) * (0.6 + Math.random() * 0.8) * scaleMult,
        life: 0,
        maxLife: 0.32 + Math.random() * 0.25,
      });
    }

    // Secondary white-hot muzzle/flash burst
    this.particles.push({
      x, y, z, vx: 0, vy: 0.4, vz: 0,
      color: '#fffbe0', size: 4.4 * scaleMult, life: 0, maxLife: 0.14,
    });

    // Rising rolling smoke column (alpha-blended layer)
    const smokeCount = size === 'large' ? 18 : size === 'medium' ? 10 : 5;
    for (let i = 0; i < smokeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = (size === 'large' ? 3 : 1.4) * Math.random();
      this.particles.push({
        x: x + Math.cos(theta) * radius,
        y: y + Math.random() * 1.2,
        z: z + Math.sin(theta) * radius,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 2.2 + Math.random() * 2.4,
        vz: (Math.random() - 0.5) * 1.2,
        color: Math.random() < 0.5 ? '#3c3934' : '#241f1b',
        size: (size === 'large' ? 3.2 : 1.6) * (0.8 + Math.random() * 0.9),
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        smoke: true,
      });
    }

    // Fast flying debris sparks (high velocity, gravity, small glow)
    const sparkCount = size === 'large' ? 22 : size === 'medium' ? 12 : 6;
    for (let i = 0; i < sparkCount; i++) {
      const speed = speedBase * (1.2 + Math.random() * 1.6);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      this.particles.push({
        x, y, z,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.abs(Math.cos(phi)) * speed + 2,
        vz: Math.sin(phi) * Math.sin(theta) * speed,
        color: Math.random() < 0.5 ? '#ffd23c' : '#ff8a1f',
        size: (size === 'large' ? 1.1 : 0.7) * (0.7 + Math.random() * 0.6),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        gravity: 20,
      });
    }

    this.screenShake = Math.min(1.0, this.screenShake + (size === 'large' ? 0.45 : 0.15));
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      if (p.gravity) {
        p.vy -= p.gravity * dt;
      }

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Populate the two billboarded point clouds. Glow = additive fire/muzzle/sparks,
    // smoke = alpha-blended dust/puff. Each particle's colour is honoured.
    const glowPos = this.glowGeo.getAttribute('position') as THREE.BufferAttribute;
    const glowCol = this.glowGeo.getAttribute('color') as THREE.BufferAttribute;
    const glowSize = this.glowGeo.getAttribute('size') as THREE.BufferAttribute;
    const smokePos = this.smokeGeo.getAttribute('position') as THREE.BufferAttribute;
    const smokeCol = this.smokeGeo.getAttribute('color') as THREE.BufferAttribute;
    const smokeSize = this.smokeGeo.getAttribute('size') as THREE.BufferAttribute;

    let gi = 0;
    let si = 0;
    const tmpColor = new THREE.Color();
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife;
      tmpColor.set(p.color);
      const scale = Math.max(0.02, p.size * (p.smoke ? 1 : (0.4 + 0.6 * alpha)));
      if (p.smoke) {
        if (si >= this.SMOKE_CAP) continue;
        smokePos.setXYZ(si, p.x, p.y, p.z);
        // smoke fades from grey to translucent as it dissipates
        const s = 0.45 + 0.55 * alpha;
        smokeCol.setXYZ(si, tmpColor.r * s + 0.15, tmpColor.g * s + 0.15, tmpColor.b * s + 0.12);
        smokeSize.setX(si, scale * 22);
        si++;
      } else {
        if (gi >= this.MAX_PARTICLES) continue;
        glowPos.setXYZ(gi, p.x, p.y, p.z);
        glowCol.setXYZ(gi, tmpColor.r, tmpColor.g, tmpColor.b);
        glowSize.setX(gi, scale);
        gi++;
      }
    }

    // Park any unused slots far below so they never render on screen.
    for (let i = gi; i < this.MAX_PARTICLES; i++) glowPos.setXYZ(i, 0, -9999, 0);
    for (let i = si; i < this.SMOKE_CAP; i++) smokePos.setXYZ(i, 0, -9999, 0);

    glowPos.needsUpdate = true;
    glowCol.needsUpdate = true;
    glowSize.needsUpdate = true;
    smokePos.needsUpdate = true;
    smokeCol.needsUpdate = true;
    smokeSize.needsUpdate = true;
    this.glowPoints.count = gi;
    this.smokePoints.count = si;
  }

  /* ================= RADAR DATA FOR HUD ================= */
  private updateRadarBlips() {
    const blips: RadarBlip[] = [];
    const turretHeading = this.yaw;

    for (const e of this.enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.position.x, e.position.z);
      // World bearing angle (0 to 2*PI)
      const worldBearing = Math.atan2(e.position.x, -e.position.z);
      // Angle relative to turret center view
      let relAngle = worldBearing - turretHeading;
      while (relAngle > Math.PI) relAngle -= Math.PI * 2;
      while (relAngle < -Math.PI) relAngle += Math.PI * 2;

      blips.push({
        id: e.id,
        type: e.type,
        distance: dist,
        angleRel: relAngle,
        compassAngle: ((worldBearing * 180) / Math.PI + 360) % 360,
        elevation: e.position.y,
      });
    }

    const headingDeg = ((turretHeading * 180) / Math.PI + 360) % 360;
    if (this.onRadarUpdate) {
      this.onRadarUpdate(blips, headingDeg);
    }
  }

  /* ================= ANIMATION & RENDER LOOP ================= */
  private animate() {
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Auto-fire: when enabled, fire while the crosshair is over a target
    if (this.gameState === 'playing' && this.mobileControls && this.mobileSettings.autoFire !== 'off') {
      this.isFiring = this.isCrosshairOnTarget();
    }

    // Continuous weapon fire when holding trigger
    if (this.isFiring && this.gameState === 'playing') {
      this.triggerFire();
    }

    // Check weapon reload timers
    const now = performance.now();
    for (const key of Object.keys(this.weapons) as WeaponType[]) {
      const w = this.weapons[key];
      if (w.reloading && now - w.reloadStart >= w.reloadTimeMs) {
        w.reloading = false;
        w.ammo = w.maxAmmo;
        if (this.onWeaponUpdate) this.onWeaponUpdate(this.weapons, this.currentWeapon);
      }
      // M60 overheat cooldown: cools when not firing; recovers from overheat after a delay
      if (key === 'm60' && w.heat !== undefined) {
        if (!this.isFiring || this.currentWeapon !== 'm60') {
          w.heat = Math.max(0, w.heat - dt * 0.25); // cool down ~4s from full
        }
        if (w.overheated) {
          w.heat = Math.max(0, w.heat - dt * 0.5);
          if (w.heat <= 0.35) w.overheated = false;
        }
      }
    }

    // Kamikaze drone cooldown ticks down
    if (this.stats.kamikazeCooldown > 0) {
      this.stats.kamikazeCooldown = Math.max(0, this.stats.kamikazeCooldown - dt * 1000);
    }

    // Barrel recoil recovery — the whole ZU unit kicks back on its side
    if (this.recoilL > 0) {
      this.recoilL = Math.max(0, this.recoilL - dt * 3.5);
      const z = this.recoilL * 0.4;
      this.leftBarrel.position.z = -2.2 + z;
      this.aaBarrelL2.position.z = -2.2 + z;
    }
    if (this.recoilR > 0) {
      this.recoilR = Math.max(0, this.recoilR - dt * 3.5);
      const z = this.recoilR * 0.4;
      this.rightBarrel.position.z = -2.2 + z;
      this.aaBarrelR2.position.z = -2.2 + z;
    }
    // 105mm cannon recoil (left & right cannon, each shot kicks one)
    if (this.recoilHeavyL > 0) {
      this.recoilHeavyL = Math.max(0, this.recoilHeavyL - dt * 2.8);
      this.cannonL.position.z = -2.4 + this.recoilHeavyL * 0.7;
    }
    if (this.recoilHeavyR > 0) {
      this.recoilHeavyR = Math.max(0, this.recoilHeavyR - dt * 2.8);
      this.cannonR.position.z = -2.4 + this.recoilHeavyR * 0.7;
    }

    // Simulation updates
    this.updateSpawning(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateFloaters(dt);
    this.updateRadarBlips();
    this.updateAtmosphere(dt);

    // First-Person Gun Viewmodel animation (idle breathing, sway, recoil, casings)
    this.gunView.update(dt);

    // Allied Fighter Jet Strikes
    for (let j = this.alliedJets.length - 1; j >= 0; j--) {
      const jet = this.alliedJets[j];
      jet.group.position.addScaledVector(jet.velocity, dt);

      // Drop bombs along the mountain corridor
      const nowMs = performance.now();
      if (jet.bombsLeft > 0 && nowMs - jet.lastBombTime > 260) {
        jet.bombsLeft--;
        jet.lastBombTime = nowMs;

        const bombPos = jet.group.position.clone();
        const bombGeo = new THREE.SphereGeometry(0.45, 6, 6);
        const bombMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const bombMesh = new THREE.Mesh(bombGeo, bombMat);
        bombMesh.position.copy(bombPos);
        this.scene.add(bombMesh);

        this.projectiles.push({
          id: this.nextEntityId++,
          type: 'player_cannon',
          mesh: bombMesh,
          position: { x: bombPos.x, y: bombPos.y, z: bombPos.z },
          velocity: { x: (Math.random() - 0.5) * 4, y: -42, z: jet.velocity.z * 0.4 },
          damage: 260,
          splashRadius: 18.0,
          lifetime: 0,
          maxLifetime: 2.5,
        });
      }

      // Despawn once well past the battlefield
      if (jet.group.position.z < -260) {
        this.scene.remove(jet.group);
        this.alliedJets.splice(j, 1);
      }
    }

    // Camera screen shake damping
    if (this.screenShake > 0 && !this.reducedMotion) {
      this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
      const shakeMag = this.screenShake * 0.25;
      this.camera.position.x += (Math.random() - 0.5) * shakeMag;
      this.camera.position.y += (Math.random() - 0.5) * shakeMag;
    } else {
      this.screenShake = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public cleanup() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
