/**
 * Core types for Qandil Beachhead 3D
 */

export type WeaponType = 'm60' | 'aa_gun' | 'heavy_cannon' | 'missile' | 'handgun';

export interface WeaponState {
  type: WeaponType;
  name: string;
  ammo: number;
  maxAmmo: number;
  fireRateMs: number;
  lastFired: number;
  damage: number;
  splashRadius: number;
  projectileSpeed: number;
  spread: number; // aim cone half-angle in radians (0 = pinpoint)
  unlimited: boolean;
  reloading: boolean;
  reloadTimeMs: number;
  reloadStart: number;
  heat?: number;      // 0..1 (M60 overheat)
  overheated?: boolean;
  lockOnStart?: number; // ms timestamp when SAM lock-on began
}

export type EnemyType = 'soldier' | 'tank' | 'apc' | 'helicopter' | 'paratrooper' | 'transport_plane' | 'jet';

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  meshGroup: any; // THREE.Group
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  hp: number;
  maxHp: number;
  speed: number;
  scoreValue: number;
  hitRadius: number;
  dead: boolean;
  
  // Specific behaviors
  state: 'advancing' | 'aiming' | 'firing' | 'descending' | 'circling' | 'dropping' | 'fleeing';
  stateTimer: number;
  fireCooldown: number;
  lastFireTime: number;
  
  // Pathing for ground units (soldiers, tanks, APCs)
  pathIndex?: number;
  path?: { x: number; z: number }[];
  
  // Soldier behavior
  runCycleOffset?: number;
  leftLeg?: any;
  rightLeg?: any;
  rifle?: any;
  proneTimer?: number;     // seconds remaining in prone/cover state
  prone?: boolean;         // soldier is lying prone / kneeling
  coverDir?: number;       // direction (radians) of the cover position
  engageDist?: number;     // distance at which this soldier stops & engages
  baseScale?: number;      // soldier body-size variation scale

  // Tank & APC specifics
  turretMesh?: any;
  cannonMesh?: any;
  wheels?: any[];
  troopsRemaining?: number;
  hasDeployedTroops?: boolean;
  
  // Helicopter specifics
  mainRotorMesh?: any;
  tailRotorMesh?: any;
  dropsLeft?: number;
  strafeDir?: number;
  
  // Paratrooper specifics
  parachuteMesh?: any;
  landingY?: number;

  // Cargo plane / jet specifics
  dropInterval?: number;   // seconds between sequential paratrooper drops (cargo plane)
  lastDropTime?: number;   // ms timestamp of last drop
  dropsTotal?: number;     // remaining paratroopers to drop
  strafePhase?: 'approach' | 'pass' | 'exit'; // jet strafe pass phases
  burstLeft?: number;      // remaining shots in the current strafe burst
  burstTimer?: number;
}

export interface ProjectileEntity {
  id: number;
  type: 'player_bullet' | 'player_cannon' | 'player_missile' | 'enemy_bullet' | 'enemy_shell' | 'enemy_rocket';
  mesh: any;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  damage: number;
  splashRadius: number;
  lifetime: number;
  maxLifetime: number;
  targetId?: number; // for homing missiles
  hp?: number;       // shootable enemy shells (interception mechanic)
}

export interface ParticleEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity?: number;
  smoke?: boolean;      // render on the alpha-blended smoke/dust layer vs additive glow
}

export interface RadarBlip {
  id: number;
  type: EnemyType;
  distance: number;
  angleRel: number; // Angle relative to player turret view (-PI to +PI)
  compassAngle: number; // 0 to 360 world bearing
  elevation: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WaveConfig {
  waveNumber: number;
  name: string;
  soldiersCount: number;
  tanksCount: number;
  apcsCount: number;
  helicoptersCount: number;
  airborneDropsCount: number;
  spawnIntervalMs: number;
  difficulty?: Difficulty;
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  difficulty: Difficulty;
  kills: {
    soldiers: number;
    tanks: number;
    apcs: number;
    helicopters: number;
    paratroopers: number;
  };
  shotsFired: number;
  shotsHit: number;
  baseHealth: number;
  maxBaseHealth: number;
  totalWaveEnemies: number;
  remainingWaveEnemies: number;
  airstrikesAvailable: number;
  currentEchelon?: number;
  totalEchelons?: number;
  activeThreats?: number;
}
