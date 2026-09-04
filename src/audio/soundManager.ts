/**
 * Web Audio API procedural sound synthesizer for Qandil Beachhead 3D.
 * Generates all weapon, engine, explosion, and ambient sounds dynamically.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private heliOsc: OscillatorNode | null = null;
  private heliGain: GainNode | null = null;
  private heliFilter: BiquadFilterNode | null = null;
  private activeHelisCount: number = 0;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.heliGain && this.ctx) {
      this.heliGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    return buffer;
  }

  // Dual 30mm Anti-Air Autocannon Shot
  public playAAGun(leftBarrel: boolean = false) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Snappy noise transient
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.1);
    if (!buf) return;
    noise.buffer = buf;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(leftBarrel ? 2400 : 2100, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    // Punch oscillator
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.1);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 105mm Heavy Bunker Cannon (Massive punch)
  public playHeavyCannon() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.45);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    // Blast noise
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.4);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.38);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    subOsc.start(t);
    subOsc.stop(t + 0.52);
    noise.start(t);
    noise.stop(t + 0.42);
  }

  // Guided Missile Launch
  public playMissileLaunch() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.7);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(2200, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(500, t + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.72);
  }

  // Explosion (soldiers, tanks, helis)
  public playExplosion(scale: 'small' | 'medium' | 'large' = 'medium') {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = scale === 'large' ? 0.9 : scale === 'medium' ? 0.6 : 0.35;
    const maxFreq = scale === 'large' ? 700 : scale === 'medium' ? 1200 : 1800;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(dur);
    if (!buf) return;
    noise.buffer = buf;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(maxFreq, t);
    lp.frequency.exponentialRampToValueAtTime(45, t + dur);

    const gain = this.ctx.createGain();
    const vol = scale === 'large' ? 0.9 : scale === 'medium' ? 0.65 : 0.4;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const rumble = this.ctx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(scale === 'large' ? 80 : 110, t);
    rumble.frequency.exponentialRampToValueAtTime(25, t + dur * 0.8);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(vol * 0.7, t);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);

    noise.connect(lp);
    lp.connect(gain);
    gain.connect(this.ctx.destination);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + dur + 0.05);
    rumble.start(t);
    rumble.stop(t + dur + 0.05);
  }

  // Fighter Jet Supersonic Airstrike Flyby
  public playJetFlyby() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(2.6);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, t);
    filter.frequency.linearRampToValueAtTime(1600, t + 1.0); // Jet approaching roar
    filter.frequency.exponentialRampToValueAtTime(280, t + 2.5); // Jet departing doppler

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.linearRampToValueAtTime(0.85, t + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 2.6);

    // High whine turbine oscillator
    const turbine = this.ctx.createOscillator();
    turbine.type = 'sawtooth';
    turbine.frequency.setValueAtTime(650, t);
    turbine.frequency.linearRampToValueAtTime(1900, t + 1.0);
    turbine.frequency.exponentialRampToValueAtTime(450, t + 2.4);

    const turbineGain = this.ctx.createGain();
    turbineGain.gain.setValueAtTime(0.01, t);
    turbineGain.gain.linearRampToValueAtTime(0.25, t + 1.0);
    turbineGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    turbine.connect(turbineGain);
    turbineGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 2.6);
    turbine.start(t);
    turbine.stop(t + 2.5);
  }

  // Shell casing metallic clink
  public playBrassClink() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200 + Math.random() * 800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Tank main gun firing at mountain bunker
  public playTankShot() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.48);
  }

  // Helicopter presence sound
  public updateHelicopters(count: number) {
    if (this.isMuted || !this.ctx) return;
    this.activeHelisCount = count;

    if (count > 0 && !this.heliOsc) {
      const t = this.ctx.currentTime;
      this.heliOsc = this.ctx.createOscillator();
      this.heliOsc.type = 'sawtooth';
      this.heliOsc.frequency.setValueAtTime(28, t); // chopper blade pulse

      this.heliFilter = this.ctx.createBiquadFilter();
      this.heliFilter.type = 'bandpass';
      this.heliFilter.frequency.setValueAtTime(140, t);
      this.heliFilter.Q.value = 3;

      this.heliGain = this.ctx.createGain();
      this.heliGain.gain.setValueAtTime(0.01, t);

      this.heliOsc.connect(this.heliFilter);
      this.heliFilter.connect(this.heliGain);
      this.heliGain.connect(this.ctx.destination);

      this.heliOsc.start(t);
    }

    if (this.heliGain && this.ctx) {
      const targetVol = this.isMuted ? 0 : Math.min(0.25, count * 0.08);
      this.heliGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.2);
    }

    if (count === 0 && this.heliOsc && this.ctx) {
      try {
        this.heliOsc.stop(this.ctx.currentTime + 0.25);
      } catch {
        // ignore
      }
      this.heliOsc = null;
      this.heliGain = null;
    }
  }

  // Base bunker struck by enemy shell/bullet
  public playHitBase() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Parachute deployment snap
  public playParachuteChute() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.25);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.22);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.26);
  }

  // Flare launch: soft "thump" whoosh
  public playFlare() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.3);
    if (!buf) return;
    noise.buffer = buf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(1800, t + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.28);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.22, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(this.ctx.destination);
    osc.connect(og);
    og.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.32);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Weapon reload clank
  public playReload() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // First click (magazine eject)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(550, t);
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.2, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(g1);
    g1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.09);

    // Second click (bolt chamber)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, t + 0.2);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.3, t + 0.2);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc2.connect(g2);
    g2.connect(this.ctx.destination);
    osc2.start(t + 0.2);
    osc2.stop(t + 0.33);
  }

  // Wave dispatch military horn
  public playWaveHorn() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(293.66, t + 0.2);
    osc.frequency.setValueAtTime(370, t + 0.4);
    osc.frequency.setValueAtTime(440, t + 0.65);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
    gain.gain.setValueAtTime(0.3, t + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.25);
  }

  // Enemy soldier rifle shot
  public playEnemyRifle() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.06);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.07);
  }

  // .45 handgun: sharp, short report with a low punch
  public playHandgun() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.05);
    if (!buf) return;
    noise.buffer = buf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(900, t);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.34, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.05);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.22, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(this.ctx.destination);
    osc.connect(og);
    og.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.06);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // M60 machine gun: heavier, slower report than the AA autocannon
  public playM60() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.09);
    if (!buf) return;
    noise.buffer = buf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1300, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.07);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.3, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(bp);
    bp.connect(gain);
    gain.connect(this.ctx.destination);
    osc.connect(og);
    og.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.1);
    osc.start(t);
    osc.stop(t + 0.09);
  }
}

export const soundManager = new SoundManager();
