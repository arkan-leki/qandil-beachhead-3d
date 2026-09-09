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
  scope: string;
  airAttack: string;
  drone: string;
  ready: string;
  cooldown: string;
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

  // Cheats (Classic Beachhead)
  cheats: string;
  godMode: string;
  infiniteAmmo: string;
  cheatConsole: string;
  enterCheatPrompt: string;

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
    scope: 'SCOPE',
    airAttack: 'AIR STRIKE',
    drone: 'DRONE',
    ready: 'READY',
    cooldown: 'WAIT',
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

    cheats: 'CLASSIC CHEATS',
    godMode: 'God Mode (Invincible)',
    infiniteAmmo: 'Infinite Ammo',
    cheatConsole: 'Cheat Console',
    enterCheatPrompt: 'Enter classic cheat (e.g. god, ammo, lock and load, skip, kill them high)...',

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
    scope: 'دووربین',
    airAttack: 'بۆردومان',
    drone: 'درۆن',
    ready: 'ئامادەیە',
    cooldown: 'چاوەڕوانبە',
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

    cheats: 'کۆدی ساختە',
    godMode: 'نەبەزی (بێ زەرەر)',
    infiniteAmmo: 'فیشەکی بێسنوور',
    cheatConsole: 'کۆنسۆڵی کۆد',
    enterCheatPrompt: 'کۆدی ساختە بنووسە (وەک god, ammo, lock and load, skip)...',

    weaponNames: {
      m60: { label: 'دەسڕێژی دووانەی M60', short: 'M60' },
      aa_gun: { label: 'تۆپی دژە فڕۆکەی ZU-23', short: 'ZU-23' },
      heavy_cannon: { label: 'تۆپی قورسی ١٠٥ملم', short: '١٠٥ملم' },
      missile: { label: 'مووشەکی ستینگەر', short: 'SAM' },
      handgun: { label: 'دەمانچەی تاکتیکی', short: 'دەمانچە' },
    },
  },

  zh: {
    gameTitle: '抢滩登陆 3D',
    gameSubtitle: '经典阵地防御战 · 誓死坚守阵地',
    mountainOutpost: '前沿阵地要塞',
    selectDifficulty: '选择战役难度',
    easy: '简单',
    easyTag: '巡逻前哨',
    medium: '普通',
    mediumTag: '步坦协同',
    hard: '困难',
    hardTag: '全面强攻',
    startDefense: '开始战斗',
    controlsBrief: '瞄准: 鼠标 / 滑动 • 开火: 左键 / 点按 • 武器: [1-5/M/G] • 空袭: [B] • 秘籍: [~ / +]',

    waveRepelled: '击退敌军进攻！',
    allEchelonsCleared: '来犯装甲集群与空降部队已全数歼灭',
    nextWave: '迎战下一波敌军',

    bunkerOverrun: '碉堡阵地沦陷！',
    breachedOnWave: '防御阵地陷落于波次',
    redeploy: '重整旗鼓 · 再次战斗',
    changeDifficulty: '战役难度',

    score: '作战得分',
    wave: '敌军波次',
    kills: '击毁目标',
    accuracy: '射击命中率',
    highScore: '历史最高分',
    ech: '梯队',

    settings: '战备设置',
    language: '语言选择',
    graphicsQuality: '画面画质',
    aimControl: '瞄准模式 (移动端)',
    autoFire: '自动射击',
    gyroSensitivity: '陀螺仪灵敏度',
    aimAssist: '辅助瞄准',
    haptics: '震动反馈',
    invertY: 'Y轴垂直反转',
    reducedMotion: '减少动态特效',
    close: '关闭',
    drag: '滑动瞄准',
    gyro: '陀螺仪',
    both: '混合操控',
    off: '关闭',
    on: '开启',
    smart: '智能',
    low: '低',
    high: '高',
    med: '中',

    fire: '开火',
    guns: '武器库',
    scope: '开镜',
    airAttack: '空袭',
    drone: '无人机',
    ready: '就绪',
    cooldown: '冷却',
    tapFireHoldGuns: '点按开火 · 长按切换武器',
    bunkerIntegrity: '碉堡装甲强度',
    reloading: '正在装填换弹...',
    overheat: '枪管严重过热！',
    inf: '无限',
    airstrikeTitle: (left) => `战机空中轰炸 (B) — 剩余 ${left} 次`,
    kamikazeTitle: '巡飞自杀式无人机 (每60秒就绪)',
    flareTitle: '发射夜间照明弹 (F)',
    zoomTitle: (z) => `瞄准倍镜 (${z}x)`,
    muteTitle: '静音',
    unmuteTitle: '开启音效',
    fullscreenTitle: '全屏模式',
    exitFullscreenTitle: '退出全屏',
    settingsTitle: '战备设置',
    dragAimHint: '◀ 滑动 = 瞄准',
    tapGunHint: '点按 = 开火 ▶',
    waveBannerTitle: (w) => `第 ${w} 波 敌军来袭`,
    nightMissionBanner: '夜间突袭战 — 探照灯已启动',
    airdropInboundNotice: '盟军空投补给箱降落中 — 射击木箱拾取补给',
    munitionsReceivedNotice: '弹药补给与装甲抢修已完成！(+25 装甲)',
    wheelHoldRelease: '按住选择\n松开装备',
    inView: '视野内',
    tgt: '目标',

    rotateTitle: '请旋转至横屏游玩',
    rotateDesc: '抢滩登陆推荐横屏沉浸体验，请横置手机以获得更广阔的战场视野与顺畅操控。',

    cheats: '经典秘籍',
    godMode: '无敌模式 (免伤)',
    infiniteAmmo: '无限弹药',
    cheatConsole: '秘籍控制台',
    enterCheatPrompt: '输入经典秘籍 (例如: god, ammo, lock and load, skip, kill them high)...',

    weaponNames: {
      m60: { label: '双联M60重机枪', short: 'M60' },
      aa_gun: { label: 'ZU-23双联高射机炮', short: 'ZU-23' },
      heavy_cannon: { label: '105毫米反装甲重型火炮', short: '105MM' },
      missile: { label: '毒刺防空导弹', short: 'SAM' },
      handgun: { label: '.45口径战术自卫手枪', short: '手枪' },
    },
  },
};
