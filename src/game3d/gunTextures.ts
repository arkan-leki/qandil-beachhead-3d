/**
 * Procedural High-Definition PBR Firearm & Ordnance Textures.
 * Generates realistic gun metal (Parkerized/blued steel), tactical checkered grips,
 * stamped military ammunition cans, linked brass cartridges, and composite missile pods.
 */
import * as THREE from 'three';

export interface GunMaterialSet {
  gunSteel: THREE.MeshStandardMaterial;
  darkNitride: THREE.MeshStandardMaterial;
  brushedChrome: THREE.MeshStandardMaterial;
  checkeredGrip: THREE.MeshStandardMaterial;
  ammoCanOD: THREE.MeshStandardMaterial;
  linkedAmmoBrass: THREE.MeshStandardMaterial;
  bulletCopper: THREE.MeshStandardMaterial;
  ammoLinkSteel: THREE.MeshStandardMaterial;
  missileComposite: THREE.MeshStandardMaterial;
  sightGlowGreen: THREE.MeshBasicMaterial;
  opticGlass: THREE.MeshPhysicalMaterial;
  thermalWrap: THREE.MeshStandardMaterial;
}

// 1. Realistic Gun Metal: Parkerized Matte Blued Gun Steel with Rollmarks & Edge Wear
function createGunMetalTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const width = 1024;
  const height = 1024;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 512;
  bCanvas.height = 512;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = 512;
  rCanvas.height = 512;
  const rCtx = rCanvas.getContext('2d')!;

  // Dark blued / manganese phosphate base
  ctx.fillStyle = '#1c2024';
  ctx.fillRect(0, 0, width, height);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);

  rCtx.fillStyle = '#666666';
  rCtx.fillRect(0, 0, 512, 512);

  // Micro-crystalline phosphate grain
  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const s = Math.random();
    ctx.fillStyle = s > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  // Lathe & machining tooling grain (longitudinal fine streaks)
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 30 + Math.random() * 120;
    ctx.fillStyle = `rgba(200, 215, 230, ${0.015 + Math.random() * 0.035})`;
    ctx.fillRect(x, y, len, 0.85);

    if (i % 2 === 0) {
      bCtx.fillStyle = Math.random() > 0.5 ? '#8c8c8c' : '#747474';
      bCtx.fillRect(x / 2, y / 2, len / 2, 0.8);
    }
  }

  // Gunsmith Rollmarks & Military Stampings
  ctx.save();
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillStyle = 'rgba(215, 225, 235, 0.55)';
  ctx.fillText('U.S. ORD CORP  M60  CAL. 7.62MM NATO', 60, 180);
  ctx.fillText('SER. NO. 481920-B  DEFENSE ARMAMENT', 60, 220);

  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText('ZSU-23-4 AUTO-FLAK 23x152mmB  LOT 82', 60, 480);
  ctx.fillText('SAFE  ●  SEMI  ●  AUTO', 60, 520);
  ctx.fillText('105MM BREECH MECHANISM M102  PROOF TESTED', 60, 780);
  ctx.fillText('MODEL 1911-A1 CALIBER .45 AUTOMATIC', 60, 820);
  ctx.restore();

  // Corresponding stamped impression in bump map (engraved dark depth)
  bCtx.save();
  bCtx.font = 'bold 11px "Courier New", monospace';
  bCtx.fillStyle = '#404040';
  bCtx.fillText('U.S. ORD CORP  M60  CAL. 7.62MM NATO', 30, 90);
  bCtx.fillText('SER. NO. 481920-B  DEFENSE ARMAMENT', 30, 110);
  bCtx.fillText('ZSU-23-4 AUTO-FLAK 23x152mmB  LOT 82', 30, 240);
  bCtx.fillText('SAFE  ●  SEMI  ●  AUTO', 30, 260);
  bCtx.fillText('105MM BREECH MECHANISM M102  PROOF TESTED', 30, 390);
  bCtx.fillText('MODEL 1911-A1 CALIBER .45 AUTOMATIC', 30, 410);
  bCtx.restore();

  // Polished silver edge wear highlights along friction margins
  ctx.strokeStyle = 'rgba(230, 240, 250, 0.42)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.strokeRect(width * 0.25, 12, width * 0.5, height * 0.35);
  ctx.strokeRect(20, height * 0.45, width - 40, height * 0.45);

  // Roughness map: worn edges are slicker/shinier (darker in roughness)
  rCtx.strokeStyle = '#282828';
  rCtx.lineWidth = 3;
  rCtx.strokeRect(4, 4, 504, 504);

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

// 2. Tactical Checkered Grip Texture (Diamond Knurling & Grip Stippling)
function createCheckeredGripTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 256;
  bCanvas.height = 256;
  const bCtx = bCanvas.getContext('2d')!;

  // Rich dark polymer / walnut base
  ctx.fillStyle = '#181a1c';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#606060';
  bCtx.fillRect(0, 0, 256, 256);

  // Diamond knurling grid pattern
  const step = 8;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      // Pyramid diamond tip highlight
      ctx.fillStyle = '#2f343a';
      ctx.beginPath();
      ctx.moveTo(x + step / 2, y);
      ctx.lineTo(x + step, y + step / 2);
      ctx.lineTo(x + step / 2, y + step);
      ctx.lineTo(x, y + step / 2);
      ctx.closePath();
      ctx.fill();

      // Shadow in knurl valleys
      ctx.strokeStyle = '#0e0f11';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bump pyramid highlight
      const bx = x / 2;
      const by = y / 2;
      const bStep = step / 2;
      bCtx.fillStyle = '#c0c0c0';
      bCtx.beginPath();
      bCtx.arc(bx + bStep / 2, by + bStep / 2, bStep * 0.35, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  return { map, bumpMap };
}

// 3. Military Olive-Drab Ammunition Can Texture (Stamped Ribs & Yellow Stencils)
function createAmmoCanTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 256;
  bCanvas.height = 256;
  const bCtx = bCanvas.getContext('2d')!;

  // Authentic military olive-drab steel
  ctx.fillStyle = '#394532';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  // Stamped structural perimeter embossing
  ctx.strokeStyle = '#273022';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, size - 40, size - 40);

  bCtx.strokeStyle = '#a8a8a8';
  bCtx.lineWidth = 4;
  bCtx.strokeRect(10, 10, 118, 118);

  // Stamped structural diagonal stiffening ribs
  ctx.strokeStyle = '#2b3626';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(35, 35);
  ctx.lineTo(size - 35, size - 35);
  ctx.moveTo(size - 35, 35);
  ctx.lineTo(35, size - 35);
  ctx.stroke();

  bCtx.strokeStyle = '#b0b0b0';
  bCtx.lineWidth = 3;
  bCtx.beginPath();
  bCtx.moveTo(18, 18);
  bCtx.lineTo(110, 110);
  bCtx.moveTo(110, 18);
  bCtx.lineTo(18, 110);
  bCtx.stroke();

  // Crisp Yellow Military Stenciling
  ctx.save();
  ctx.fillStyle = '#e8ba22';
  ctx.font = 'bold 24px "Arial Black", sans-serif';
  ctx.fillText('100 CRTG 7.62MM', 50, 140);
  ctx.font = 'bold 20px "Arial Black", sans-serif';
  ctx.fillText('NATO  M62 TRACER', 50, 175);
  ctx.fillText('4 BALL / 1 TRACER', 50, 208);
  ctx.font = 'bold 15px monospace';
  ctx.fillText('LOT LC-84K612-008', 50, 245);
  ctx.fillText('▲ THIS END UP ▲', 50, 275);
  ctx.restore();

  // Weathering & paint chipping along corners
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    if (x < 35 || x > size - 35 || y < 35 || y > size - 35) {
      ctx.fillStyle = Math.random() > 0.4 ? '#181d15' : '#8c9584';
      ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.ClampToEdgeWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  return { map, bumpMap };
}

// 4. Linked 7.62mm Brass Ammunition Texture (Gleaming Brass + Headstamps)
function createLinkedAmmoTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 256;
  bCanvas.height = 256;
  const bCtx = bCanvas.getContext('2d')!;

  // Polished cartridge brass base
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#a88338');
  grad.addColorStop(0.3, '#f5d77f');
  grad.addColorStop(0.5, '#e4be5b');
  grad.addColorStop(0.7, '#fff1a8');
  grad.addColorStop(1, '#a88338');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  // Extractor groove & primer ring
  ctx.fillStyle = '#544119';
  ctx.fillRect(0, 420, size, 22);
  ctx.fillRect(0, 480, size, 14);

  bCtx.fillStyle = '#303030';
  bCtx.fillRect(0, 210, 256, 11);
  bCtx.fillRect(0, 240, 256, 7);

  // Lathe turning streaks
  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + Math.random() * 0.08})`;
    ctx.fillRect(0, y, size, 1.2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 5. Rocket Launcher Composite Armor & Hazard Markings
function createRocketLauncherTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 256;
  bCanvas.height = 256;
  const bCtx = bCanvas.getContext('2d')!;

  // Dark matte composite olive fiber
  ctx.fillStyle = '#2d3527';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  // Carbon/fiberglass cross-hatch weave
  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = 'rgba(15, 18, 12, 0.35)';
    ctx.fillRect(0, y, size, 1.5);
    ctx.fillRect(y, 0, 1.5, size);
  }

  // High-visibility yellow ordnance stripe
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 180, size, 56);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 236, size, 12);

  bCtx.fillStyle = '#a0a0a0';
  bCtx.fillRect(0, 90, 256, 28);

  // Warning text
  ctx.save();
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('ROCKET 70MM HE  ◄ DANGER ►', 40, 218);
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('ARM PRIOR TO LAUNCH', 40, 310);
  ctx.fillText('BACKBLAST CLEAR 15M', 40, 335);
  ctx.restore();

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// 6. Thermal Wrap Texture for 105mm Artillery Cannon
function createThermalWrapTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 128;
  bCanvas.height = 128;
  const bCtx = bCanvas.getContext('2d')!;

  ctx.fillStyle = '#4a5043';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 128, 128);

  // Heavy canvas stitching & spiral wrap cords
  for (let y = 0; y < size; y += 16) {
    ctx.fillStyle = '#2b3026';
    ctx.fillRect(0, y, size, 3);
    ctx.fillStyle = '#656d5b';
    ctx.fillRect(0, y + 3, size, 2);

    bCtx.fillStyle = '#505050';
    bCtx.fillRect(0, y / 2, 128, 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

// Master Singleton Material Cache
let cachedMaterials: GunMaterialSet | null = null;

export function getGunMaterials(): GunMaterialSet {
  if (cachedMaterials) return cachedMaterials;

  const gunMetal = createGunMetalTexture();
  const grip = createCheckeredGripTexture();
  const ammoCan = createAmmoCanTexture();
  const linkedAmmo = createLinkedAmmoTexture();
  const rocket = createRocketLauncherTexture();
  const thermal = createThermalWrapTexture();

  cachedMaterials = {
    // 1. Primary Parkerized blued steel with laser rollmarks and edge wear
    gunSteel: new THREE.MeshStandardMaterial({
      map: gunMetal.map,
      bumpMap: gunMetal.bumpMap,
      bumpScale: 0.045,
      roughnessMap: gunMetal.roughnessMap,
      roughness: 0.32,
      metalness: 0.92,
      color: 0x22262a,
    }),

    // 2. Dark nitride coating (slides, bolt carriers, compensators)
    darkNitride: new THREE.MeshStandardMaterial({
      map: gunMetal.map,
      bumpMap: gunMetal.bumpMap,
      bumpScale: 0.05,
      roughness: 0.38,
      metalness: 0.88,
      color: 0x141618,
    }),

    // 3. Brushed chrome / stainless steel (pistol barrel, bolt face, guide rods)
    brushedChrome: new THREE.MeshStandardMaterial({
      map: gunMetal.map,
      roughness: 0.22,
      metalness: 0.96,
      color: 0xdde3ea,
    }),

    // 4. Diamond-checkered tactical polymer / walnut grip
    checkeredGrip: new THREE.MeshStandardMaterial({
      map: grip.map,
      bumpMap: grip.bumpMap,
      bumpScale: 0.08,
      roughness: 0.72,
      metalness: 0.12,
      color: 0x1c1e20,
    }),

    // 5. Stamped military olive-drab steel ammo can with yellow stenciling
    ammoCanOD: new THREE.MeshStandardMaterial({
      map: ammoCan.map,
      bumpMap: ammoCan.bumpMap,
      bumpScale: 0.06,
      roughness: 0.48,
      metalness: 0.45,
    }),

    // 6. Gleaming brass cartridge casing with extractor grooves
    linkedAmmoBrass: new THREE.MeshStandardMaterial({
      map: linkedAmmo.map,
      bumpMap: linkedAmmo.bumpMap,
      bumpScale: 0.04,
      roughness: 0.22,
      metalness: 0.95,
      color: 0xf5d268,
    }),

    // 7. Copper / gilding-metal spitzer bullet heads
    bulletCopper: new THREE.MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.90,
      color: 0xc87042,
    }),

    // 8. Blackened steel disintegrating links (M13 links)
    ammoLinkSteel: new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.85,
      color: 0x181a1c,
    }),

    // 9. Composite rocket launcher pod with yellow hazard bands
    missileComposite: new THREE.MeshStandardMaterial({
      map: rocket.map,
      bumpMap: rocket.bumpMap,
      bumpScale: 0.05,
      roughness: 0.52,
      metalness: 0.35,
    }),

    // 10. Tritium / luminescent combat sight dot (glowing green)
    sightGlowGreen: new THREE.MeshBasicMaterial({
      color: 0x44ff66,
    }),

    // 11. Optical sight glass with anti-reflective sapphire/emerald coating
    opticGlass: new THREE.MeshPhysicalMaterial({
      color: 0x1a4038,
      transmission: 0.75,
      opacity: 0.9,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      ior: 1.52,
    }),

    // 12. Heavy canvas thermal protective wrap for 105mm artillery barrel
    thermalWrap: new THREE.MeshStandardMaterial({
      map: thermal.map,
      bumpMap: thermal.bumpMap,
      bumpScale: 0.08,
      roughness: 0.85,
      metalness: 0.05,
    }),
  };

  return cachedMaterials;
}
