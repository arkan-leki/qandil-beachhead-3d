import { Language, WeaponType } from './types';

export interface Translations {
  gameTitle: string;
  gameSubtitle: string;
  mountainOutpost: string;
  selectDifficulty: string;
  easy: string;
  easyTag: string;
  medium: string;
  mediumTag: string;
  hard: string;
  hardTag: string;
  startDefense: string;
  controlsBrief: string;

  // Wave cleared
  waveRepelled: string;
  allEchelonsCleared: string;
  nextWave: string;

  // Game Over
  bunkerOverrun: string;
  breachedOnWave: string;
  redeploy: string;
  changeDifficulty: string;

  // Stats
  score: string;
  wave: string;
  kills: string;
  accuracy: string;
  highScore: string;
  ech: string;

  // Settings
  settings: string;
  language: string;
  graphicsQuality: string;
  aimControl: string;
  autoFire: string;
  gyroSensitivity: string;
  aimAssist: string;
  haptics: string;
  invertY: string;
  reducedMotion: string;
  close: string;
  drag: string;
  gyro: string;
  both: string;
  off: string;
  on: string;
  smart: string;
  low: string;
  high: string;
  med: string;

  // HUD & Weapons
  fire: string;
  guns: string;
  tapFireHoldGuns: string;
  bunkerIntegrity: string;
  reloading: string;
  overheat: string;
  inf: string;
  airstrikeTitle: (left: number) => string;
  kamikazeTitle: string;
  flareTitle: string;
  zoomTitle: (z: number) => string;
  muteTitle: string;
  unmuteTitle: string;
  fullscreenTitle: string;
  exitFullscreenTitle: string;
  settingsTitle: string;
  dragAimHint: string;
  tapGunHint: string;
  waveBannerTitle: (w: number) => string;
  nightMissionBanner: string;
  airdropInboundNotice: string;
  munitionsReceivedNotice: string;
  wheelHoldRelease: string;
  inView: string;
  tgt: string;

  // Orientation prompt
  rotateTitle: string;
  rotateDesc: string;

  // Weapon Names
  weaponNames: Record<WeaponType, { label: string; short: string }>;
}

export const I18N: Record<Language, Translations> = {
  en: {
    gameTitle: 'QANDIL BEACHHEAD 3D',
    gameSubtitle: 'TACTICAL REDOUBT DEFENSE • HOLD THE PASS',
    mountainOutpost: 'MOUNTAIN WARFARE OUTPOST',
    selectDifficulty: 'SELECT DIFFICULTY',
    easy: 'EASY',
    easyTag: 'PATROL FORCE',
    medium: 'MEDIUM',
    mediumTag: 'COMBINED ASSAULT',
    hard: 'HARD',
    hardTag: 'TOTAL ONSLAUGHT',
    startDefense: 'START DEFENSE',
    controlsBrief: 'AIM: MOUSE / DRAG • FIRE: CLICK / TAP • WEAPONS: [1-5] • AIRSTRIKE: [B]',

    waveRepelled: 'WAVE REPELLED',
    allEchelonsCleared: 'HOSTILE FORCES NEUTRALIZED',
    nextWave: 'COMMENCE NEXT WAVE',

    bunkerOverrun: 'BUNKER OVERRUN',
    breachedOnWave: 'REDOUBT DEFENSES BREACHED ON WAVE',
    redeploy: 'REDEPLOY TO REDOUBT',
    changeDifficulty: 'DIFFICULTY',

    score: 'SCORE',
    wave: 'WAVE',
    kills: 'HOSTILES DESTROYED',
    accuracy: 'ACCURACY',
    highScore: 'HIGH SCORE',
    ech: 'ECH',

    settings: 'SETTINGS',
    language: 'LANGUAGE',
    graphicsQuality: 'GRAPHICS QUALITY',
    aimControl: 'AIM CONTROL (MOBILE)',
    autoFire: 'AUTO-FIRE',
    gyroSensitivity: 'GYRO SENSITIVITY',
    aimAssist: 'AIM ASSIST',
    haptics: 'HAPTICS',
    invertY: 'INVERT Y',
    reducedMotion: 'REDUCED MOTION',
    close: 'CLOSE',
    drag: 'DRAG',
    gyro: 'GYRO',
    both: 'BOTH',
    off: 'OFF',
    on: 'ON',
    smart: 'SMART',
    low: 'LOW',
    high: 'HIGH',
    med: 'MED',

    fire: 'FIRE',
    guns: 'GUNS',
    tapFireHoldGuns: 'TAP FIRE · HOLD GUNS',
    bunkerIntegrity: 'BUNKER INTEGRITY',
    reloading: 'RELOADING',
    overheat: 'OVERHEAT!',
    inf: 'INF',
    airstrikeTitle: (left) => `Airstrike (B) — ${left} left`,
    kamikazeTitle: 'Shaheen Kamikaze Drone (ready every 60s)',
    flareTitle: 'Flare (F)',
    zoomTitle: (z) => `Zoom (${z}x)`,
    muteTitle: 'Mute',
    unmuteTitle: 'Unmute',
    fullscreenTitle: 'Fullscreen',
    exitFullscreenTitle: 'Exit Fullscreen',
    settingsTitle: 'Settings',
    dragAimHint: '◀ DRAG = AIM',
    tapGunHint: 'TAP = GUN ▶',
    waveBannerTitle: (w) => `WAVE ${w}`,
    nightMissionBanner: 'NIGHT MISSION — SEARCHLIGHT ACTIVE',
    airdropInboundNotice: 'ALLIED AIRDROP INBOUND — SHOOT TO SECURE',
    munitionsReceivedNotice: 'MUNITIONS & REPAIRS RECEIVED! (+25 HP)',
    wheelHoldRelease: 'HOLD\nRELEASE',
    inView: 'IN VIEW',
    tgt: 'TGT',

    rotateTitle: 'ROTATE DEVICE',
    rotateDesc: 'This battle is played in landscape. Turn your phone sideways for full view and controls.',

    weaponNames: {
      m60: { label: 'Twin M60 AA', short: 'M60' },
      aa_gun: { label: 'ZU-23 Anti-Air', short: 'ZU-23' },
      heavy_cannon: { label: '105mm Howitzer', short: '105MM' },
      missile: { label: 'Stinger SAM Missile', short: 'SAM' },
      handgun: { label: '.45 Tactical Pistol', short: '.45' },
    },
  },

  ku: {
    gameTitle: 'بەرگری قەندیل ٣D',
    gameSubtitle: 'بەرگری لە سەنگەری قەندیل • ڕێگری لە داگیرکەران',
    mountainOutpost: 'سەنگەری پێشەوەی قەندیل',
    selectDifficulty: 'ئاستی زەحمەتی هەڵبژێرە',
    easy: 'ئاسان',
    easyTag: 'هێرشی سنووردار',
    medium: 'مامناوەند',
    mediumTag: 'هێرشی تێکەڵاو',
    hard: 'سەخت',
    hardTag: 'هێرشی گشتگیر',
    startDefense: 'دەستپێکردنی شەڕ',
    controlsBrief: 'نیشانە: موس / ڕاکێشان • تەقەکردن: کلیک • چەکەکان: [١-٥] • بۆردومان: [B]',

    waveRepelled: 'هێرشەکە تێکشکێنرا!',
    allEchelonsCleared: 'هەموو هێزەکانی دوژمن لەناو بردران',
    nextWave: 'قۆناغی داهاتوو',

    bunkerOverrun: 'سەنگەرەکە کەوت!',
    breachedOnWave: 'هێڵی بەرگری شکا لە قۆناغی',
    redeploy: 'دووبارە دەستپێکردنەوە',
    changeDifficulty: 'ئاستی زەحمەتی',

    score: 'خاڵ',
    wave: 'قۆناغ',
    kills: 'تێکشکاوان',
    accuracy: 'ڕێژەی پێکان',
    highScore: 'بەرزترین خاڵ',
    ech: 'دەستە',

    settings: 'ڕێکخستنەکان',
    language: 'زمان',
    graphicsQuality: 'کوالێتی گرافیک',
    aimControl: 'شێوازی کۆنتڕۆڵ (مۆبایل)',
    autoFire: 'تەقەی خۆکار',
    gyroSensitivity: 'هەستیاریی ژیرۆ',
    aimAssist: 'یارمەتیدەری نیشانە',
    haptics: 'لەرزین',
    invertY: 'پێچەوانەکردنی Y',
    reducedMotion: 'کەمکردنەوەی جووڵە',
    close: 'داخستن',
    drag: 'ڕاکێشان',
    gyro: 'ژیرۆ',
    both: 'هەردووکی',
    off: 'ناچالاک',
    on: 'چالاک',
    smart: 'هۆشمەند',
    low: 'نزم',
    high: 'بەرز',
    med: 'مامناوەند',

    fire: 'تەقە',
    guns: 'چەک',
    tapFireHoldGuns: 'تەقە • ڕاگرتنی چەک',
    bunkerIntegrity: 'تەندروستی سەنگەر',
    reloading: 'پڕکردنەوە...',
    overheat: 'داغبوون!',
    inf: 'بێسنوور',
    airstrikeTitle: (left) => `بۆردومانی ئاسمانی (B) — ${left} ماوە`,
    kamikazeTitle: 'درۆنی شاهین (هەر ٦٠ چرکە ئامادەیە)',
    flareTitle: 'فیشەکی ڕووناککەرەوە (F)',
    zoomTitle: (z) => `نزیککردنەوە (${z}x)`,
    muteTitle: 'بێدەنگ',
    unmuteTitle: 'دەنگدار',
    fullscreenTitle: 'شاشەی تەواو',
    exitFullscreenTitle: 'دەرچوون لە شاشەی تەواو',
    settingsTitle: 'ڕێکخستنەکان',
    dragAimHint: '◀ ڕاکێشان = نیشانە',
    tapGunHint: 'داگرتن = چەک ▶',
    waveBannerTitle: (w) => `قۆناغی ${w}`,
    nightMissionBanner: 'شەڕی شەوانە — پرۆژێکتەر کارایە',
    airdropInboundNotice: 'سەبەتەی یارمەتی گەیشت — لێی بدە بۆ وەرگرتن',
    munitionsReceivedNotice: 'فیشەک و چاککردنەوە وەرگیرا! (+٢٥)',
    wheelHoldRelease: 'ڕاگرە\nبەرپێدە',
    inView: 'لە بەرچاو',
    tgt: 'ئامانج',

    rotateTitle: 'مۆبایلەکەت بسوڕێنەوە',
    rotateDesc: 'ئەم شەڕە بە شێوەی ئاسۆیی ئەنجام دەدرێت. مۆبایلەکەت بە تەنیشتدا بگرە بۆ بینین و کۆنتڕۆڵی تەواو.',

    weaponNames: {
      m60: { label: 'دەسڕێژی دووانەی M60', short: 'M60' },
      aa_gun: { label: 'تۆپی دژە فڕۆکەی ZU-23', short: 'ZU-23' },
      heavy_cannon: { label: 'تۆپی قورسی ١٠٥ملم', short: '١٠٥ملم' },
      missile: { label: 'مووشەکی ستینگەر', short: 'SAM' },
      handgun: { label: 'دەمانچەی تاکتیکی', short: 'دەمانچە' },
    },
  },
};
