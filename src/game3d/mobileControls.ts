/**
 * Mobile & Gyroscope Input Controller.
 *
 * Provides (when running on a touch device):
 *  - Gyroscope aiming via DeviceOrientation (with iOS permission flow)
 *  - Touch gestures: tap = fire, two-finger tap = airstrike, swipe = weapon switch,
 *    swipe up = reload, pinch = zoom, long-press = settings
 *  - Auto-fire toggle (fires when crosshair is over an enemy)
 *  - Haptic feedback via navigator.vibrate
 *
 * The existing pointer-drag aiming in GameEngine remains as the fallback when
 * no gyroscope is available. This module is additive and only activates on
 * touch-capable devices.
 */

export interface MobileSettings {
  controlScheme: 'gyro' | 'touch' | 'hybrid';
  gyroSensitivity: number;   // 0.5x .. 2.0x
  gyroDeadZone: number;      // radians
  invertY: boolean;
  autoFire: 'off' | 'on' | 'smart';
  aimAssist: boolean;
  haptics: boolean;
}

export const DEFAULT_MOBILE_SETTINGS: MobileSettings = {
  controlScheme: 'touch',   // gyro OFF by default — touch drag is far more reliable
  gyroSensitivity: 1.0,
  gyroDeadZone: 0.06,
  invertY: false,
  autoFire: 'off',
  aimAssist: false,
  haptics: true,
};

const SETTINGS_KEY = 'beachhead-mobile-settings-v1';

export function loadMobileSettings(): MobileSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_MOBILE_SETTINGS };
    return { ...DEFAULT_MOBILE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MOBILE_SETTINGS };
  }
}

export function saveMobileSettings(s: MobileSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export interface MobileCallbacks {
  onFireStart: () => void;
  onFireEnd: () => void;
  onAirstrike: () => void;
  onSwitchWeapon: (dir: 1 | -1) => void;
  onReload: () => void;
  onToggleZoom: () => void;
  onAim: (deltaYaw: number, deltaPitch: number) => void;
  // Auto-fire: returns true if the crosshair is currently over a target
  isOnTarget: () => boolean;
  onSettingsOpen?: () => void;
}

export class MobileControls {
  private settings: MobileSettings;
  private cb: MobileCallbacks;
  private el: HTMLElement;
  private attached: boolean = false;

  private gyroAvailable = false;
  private gyroGranted = false;
  private gyroNeutralYaw = 0;
  private gyroNeutralPitch = 0;
  private calibrated = false;
  private smoothedYaw = 0;
  private smoothedPitch = 0;
  private lastOrientation: { beta: number; gamma: number; alpha: number } | null = null;

  // Touch gesture state
  private touchStartTime = 0;
  private touchStartPos: { x: number; y: number }[] = [];
  private pinchStartDist = 0;
  private longPressTimer: number | null = null;
  private gestureLocked = false;
  private lastTapTime = 0;

  constructor(el: HTMLElement, cb: MobileCallbacks) {
    this.settings = loadMobileSettings();
    this.cb = cb;
    this.el = el;
  }

  get isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  public init() {
    if (!this.isTouchDevice) return;
    // Gyro is only attached when the user explicitly picks a gyro scheme
    if (this.settings.controlScheme !== 'touch') {
      this.setupGyroscope();
    }
    this.setupTouch();
    this.attached = true;
  }

  public getSettings(): MobileSettings {
    return this.settings;
  }

  public setSettings(s: Partial<MobileSettings>) {
    this.settings = { ...this.settings, ...s };
    saveMobileSettings(this.settings);
    // Attach gyro the moment the user enables a gyro scheme
    if (this.settings.controlScheme !== 'touch' && !this.gyroAvailable) {
      this.setupGyroscope();
    }
  }

  public get usesGyro(): boolean {
    return this.settings.controlScheme !== 'touch' && this.gyroGranted;
  }

  public vibrate(pattern: number | number[]) {
    if (!this.settings.haptics) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }

  /* ---------------- Gyroscope ---------------- */
  private setupGyroscope() {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      this.onOrientation(e.beta, e.gamma, e.alpha || 0);
    };

    // iOS 13+ requires permission
    const doa = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof doa.requestPermission === 'function') {
      // Permission must be requested from a user gesture. We expose a method
      // that the App calls on the first tap (see requestGyroPermission).
      (this as unknown as { _gyroHandler: typeof handler })._gyroHandler = handler;
      this.gyroAvailable = true;
    } else {
      window.addEventListener('deviceorientation', handler);
      this.gyroAvailable = true;
      this.gyroGranted = true;
    }
  }

  public async requestGyroPermission(): Promise<boolean> {
    const doa = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof doa.requestPermission !== 'function') {
      this.gyroGranted = true;
      return true;
    }
    try {
      const state = await doa.requestPermission();
      this.gyroGranted = state === 'granted';
      if (this.gyroGranted) {
        const handler = (this as unknown as { _gyroHandler?: (e: DeviceOrientationEvent) => void })._gyroHandler;
        if (handler) window.addEventListener('deviceorientation', handler);
        // capture current orientation as neutral after a short delay
        setTimeout(() => this.calibrate(), 300);
      }
      return this.gyroGranted;
    } catch {
      this.gyroGranted = false;
      return false;
    }
  }

  public calibrate() {
    if (this.lastOrientation) {
      this.gyroNeutralYaw = this.lastOrientation.gamma;
      this.gyroNeutralPitch = this.lastOrientation.beta;
      this.calibrated = true;
    }
  }

  private onOrientation(beta: number, gamma: number, alpha: number) {
    this.lastOrientation = { beta, gamma, alpha };
    if (!this.calibrated) {
      this.gyroNeutralYaw = gamma;
      this.gyroNeutralPitch = beta;
      this.calibrated = true;
    }
    // Low-pass filter
    this.smoothedYaw += (gamma - this.smoothedYaw) * 0.15;
    this.smoothedPitch += (beta - this.smoothedPitch) * 0.15;

    // Dead zone
    const dz = this.settings.gyroDeadZone;
    let yaw = this.smoothedYaw - this.gyroNeutralYaw;
    let pitch = this.smoothedPitch - this.gyroNeutralPitch;
    if (Math.abs(yaw) < dz) yaw = 0;
    if (Math.abs(pitch) < dz) pitch = 0;

    const s = this.settings.gyroSensitivity;
    const invert = this.settings.invertY ? -1 : 1;
    // gamma (tilt left/right) -> yaw; beta (tilt forward/back) -> pitch
    this.cb.onAim(yaw * s * 0.9, pitch * s * invert * 0.7);
  }

  /* ---------------- Touch gestures ---------------- */
  private setupTouch() {
    this.el.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.el.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.el.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
  }

  private onTouchStart(e: TouchEvent) {
    const touches = Array.from(e.touches);
    this.touchStartPos = touches.map((t) => ({ x: t.clientX, y: t.clientY }));
    this.touchStartTime = performance.now();
    this.gestureLocked = false;

    // Request gyro permission on first user gesture (iOS)
    if (this.gyroAvailable && !this.gyroGranted) {
      this.requestGyroPermission();
    }

    if (touches.length === 2) {
      this.pinchStartDist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      return;
    }

    if (touches.length === 1) {
      // Long-press = open settings
      this.longPressTimer = window.setTimeout(() => {
        this.gestureLocked = true;
        this.cb.onSettingsOpen && this.cb.onSettingsOpen();
      }, 600);
    }
  }

  private onTouchMove(e: TouchEvent) {
    const touches = Array.from(e.touches);
    if (touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      if (this.pinchStartDist > 0) {
        const ratio = dist / this.pinchStartDist;
        if (ratio > 1.25) { this.cb.onToggleZoom(); this.pinchStartDist = dist; }
        else if (ratio < 0.8) { this.cb.onToggleZoom(); this.pinchStartDist = dist; }
      }
      return;
    }
    // If a second finger was added but this is the drag, allow engine drag-aim (no-op here)
  }

  private onTouchEnd(e: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.gestureLocked) return;

    const now = performance.now();
    const dt = now - this.touchStartTime;
    const touches = this.touchStartPos;

    if (touches.length === 0) return;

    if (touches.length === 2) {
      // two-finger tap = airstrike (if quick)
      if (dt < 350) {
        this.cb.onAirstrike();
        this.vibrate(400);
      }
      return;
    }

    // Single touch gesture resolution
    const p0 = touches[0];
    const end = e.changedTouches[0];
    if (!end) return;
    const dx = end.clientX - p0.x;
    const dy = end.clientY - p0.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 12 && dt < 300) {
      // TAP = fire (single shot); double-tap = airstrike
      if (now - this.lastTapTime < 320) {
        this.cb.onAirstrike();
        this.lastTapTime = 0;
      } else {
        this.cb.onFireStart();
        this.cb.onFireEnd();
        this.lastTapTime = now;
      }
    } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      // Horizontal swipe = weapon switch
      this.cb.onSwitchWeapon(dx < 0 ? 1 : -1);
      this.vibrate(20);
    } else if (Math.abs(dy) > 60 && dy < 0) {
      // Swipe up = reload
      this.cb.onReload();
      this.vibrate(20);
    }
  }

  public dispose() {
    if (!this.attached) return;
    // listeners use anonymous fns; this is a best-effort cleanup for re-init safety
    this.attached = false;
  }
}
