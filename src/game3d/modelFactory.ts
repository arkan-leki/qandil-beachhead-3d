/**
 * Procedural 3D Model Factory for Qandil Beachhead 3D.
 * Builds high-level 3D models for the player's anti-air turret, soldiers,
 * tanks, attack helicopters, airborne paratroopers, 360-degree gun bunker redoubt,
 * and Qandil mountain terrain.
 */
import * as THREE from 'three';
import { create360PanoramaDome, createGroundTexture } from './panoramaSkybox';

// Striped parachute canvas texture generator
function createStripedParachuteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const segments = 16;
  const segW = canvas.width / segments;
  for (let s = 0; s < segments; s++) {
    ctx.fillStyle = s % 2 === 0 ? '#cc2222' : '#f4f4f4';
    ctx.fillRect(s * segW, 0, segW, canvas.height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Procedural Camouflage Texture for Tanks & APCs (organic multi-blotch camo)
function createCamoTexture(base: string, dark: string, sand: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Mottled base
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) {
    const px = Math.random() * 1024;
    const py = Math.random() * 1024;
    const pr = 8 + Math.random() * 30;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    const shade = Math.random();
    g.addColorStop(0, shade < 0.5 ? 'rgba(30,34,22,0.18)' : 'rgba(120,110,80,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft-edged dark camo blobs (three overlapping ellipses per blob for organic shape)
  const blob = (cx: number, cy: number, r: number, color: string, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(
        cx + (Math.random() - 0.5) * r * 0.5,
        cy + (Math.random() - 0.5) * r * 0.5,
        r * (0.7 + Math.random() * 0.4),
        r * (0.45 + Math.random() * 0.4),
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  for (let i = 0; i < 46; i++) {
    blob(Math.random() * 1024, Math.random() * 1024, 40 + Math.random() * 70, dark, 0.4);
  }
  for (let i = 0; i < 34; i++) {
    blob(Math.random() * 1024, Math.random() * 1024, 28 + Math.random() * 50, sand, 0.32);
  }
  // Tiny dark flecks for bark/branch break-up
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = 'rgba(20,22,14,0.5)';
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, Math.random() * 1024, 2 + Math.random() * 5, 1.4 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.2, 1.2);
  tex.anisotropy = 8;
  return tex;
}

// Procedural Diamond Steel Tread Plate Texture for Bunker Deck
function createSteelTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#26282b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#3a3d42';
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 16) {
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 8, 5, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 8, 5, 2, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

// Procedural Warning / Hazard Stripe Texture
function createHazardStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d49b28';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#1c1c1c';
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 20, 0);
    ctx.lineTo(x - 12, 64);
    ctx.lineTo(x - 32, 64);
    ctx.closePath();
    ctx.fill();
  }

  // wear scuffs
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(Math.random() * 256, Math.random() * 64, 1 + Math.random() * 3, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Brushed-steel / armor plate with panel seams, bolts, and grime
function createSteelPlateTexture(baseHex: string, seamHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // brushed metal streaks
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(x, y, 0.6, 6 + Math.random() * 40);
  }
  // dark grime patches
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const pr = 14 + Math.random() * 60;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    g.addColorStop(0, 'rgba(0,0,0,0.14)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  // panel seams (welded lines)
  ctx.strokeStyle = seamHex;
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 60 + i * 110 + Math.random() * 20);
    ctx.lineTo(512, 55 + i * 110 + Math.random() * 25);
    ctx.stroke();
  }
  // bolts in a grid
  for (let yy = 30; yy < 512; yy += 96) {
    for (let xx = 30; xx < 512; xx += 96) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(xx, yy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.arc(xx - 1, yy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Weathered concrete texture
function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8a857a';
  ctx.fillRect(0, 0, 512, 512);
  // aggregate speckle
  for (let i = 0; i < 9000; i++) {
    const shade = 110 + Math.random() * 70;
    ctx.fillStyle = `rgba(${shade},${shade - 6},${shade - 16},0.5)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // staining
  for (let i = 0; i < 40; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const pr = 20 + Math.random() * 90;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    g.addColorStop(0, 'rgba(60,60,50,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Burlap sandbag texture with hessian weave and stitching
function createSandbagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#9a8768';
  ctx.fillRect(0, 0, 256, 256);
  // hessian weave criss-cross
  ctx.strokeStyle = 'rgba(70,58,38,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 256; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  // color mottling
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(${110 + Math.random() * 60},${95 + Math.random() * 55},${62 + Math.random() * 45},0.25)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  // dirt staining
  for (let i = 0; i < 16; i++) {
    const px = Math.random() * 256;
    const py = Math.random() * 256;
    const pr = 16 + Math.random() * 50;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    g.addColorStop(0, 'rgba(60,48,30,0.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Digital/interlocking soldier camo (woodland)
function createSoldierCamoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  // olive-vert base with digital pixels
  const palettes = ['#3f4a33', '#2e3525', '#57553c', '#23281a'];
  ctx.fillStyle = palettes[0];
  ctx.fillRect(0, 0, 512, 512);
  for (let yy = 0; yy < 512; yy += 8) {
    for (let xx = 0; xx < 512; xx += 8) {
      let idx = 0;
      // pseudo-random noise-based palette pick
      const n = Math.sin(xx * 0.7 + yy * 1.3) * 43758.5453;
      const f = n - Math.floor(n);
      idx = f < 0.34 ? 1 : f < 0.62 ? 2 : f < 0.85 ? 3 : 0;
      ctx.fillStyle = palettes[idx];
      ctx.fillRect(xx, yy, 8, 8);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

// Common military materials and colors
export const COLORS = {
  mountainRock: 0x5a544b,
  mountainRockDark: 0x3d3933,
  mountainDust: 0x8c7e6b,
  mountainGrass: 0x5e7a42,
  camoOlive: 0x475338,
  camoDark: 0x2e3525,
  camoSand: 0x8a7b60,
  armorSteel: 0x3a3f42,
  darkSteel: 0x1f2224,
  chrome: 0x8a9296,
  glass: 0x243e47,
  goldBrass: 0xbfa15f,
  hazardRed: 0xbd322c,
  parachuteCloth: 0x9fa889,
};

const tankCamoTex = createCamoTexture('#3f4a33', '#1e2417', '#736b56');
const apcCamoTex = createCamoTexture('#48523c', '#252c1e', '#80775e');
const steelTreadTex = createSteelTreadTexture();
const hazardTex = createHazardStripeTexture();
const soldierCamoTex = createSoldierCamoTexture();
const steelPlateTex = createSteelPlateTexture('#3a3f42', '#16181a');
const darkSteelPlateTex = createSteelPlateTexture('#20242a', '#0e1013');
const concreteTex = createConcreteTexture();
const sandbagTex = createSandbagTexture();

// Reusable materials
const materials = {
  armorSteel: new THREE.MeshStandardMaterial({ map: steelPlateTex, color: 0xffffff, roughness: 0.42, metalness: 0.8, bumpMap: steelPlateTex, bumpScale: 0.04 }),
  darkSteel: new THREE.MeshStandardMaterial({ map: darkSteelPlateTex, roughness: 0.5, metalness: 0.85, bumpMap: darkSteelPlateTex, bumpScale: 0.05 }),
  gunBarrel: new THREE.MeshStandardMaterial({ color: 0x181a1c, roughness: 0.26, metalness: 0.94, bumpMap: darkSteelPlateTex, bumpScale: 0.03 }),
  brass: new THREE.MeshStandardMaterial({ color: COLORS.goldBrass, roughness: 0.28, metalness: 0.9 }),
  tankGreen: new THREE.MeshStandardMaterial({ map: tankCamoTex, roughness: 0.62, metalness: 0.32, bumpMap: tankCamoTex, bumpScale: 0.02 }),
  tankCamoSand: new THREE.MeshStandardMaterial({ color: 0x6e634e, roughness: 0.7, metalness: 0.3 }),
  apcHull: new THREE.MeshStandardMaterial({ map: apcCamoTex, roughness: 0.62, metalness: 0.32, bumpMap: apcCamoTex, bumpScale: 0.02 }),
  tracks: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.78, metalness: 0.5 }),
  rubberTire: new THREE.MeshStandardMaterial({ color: 0x181a1b, roughness: 0.86, metalness: 0.1 }),
  camoSoldier: new THREE.MeshStandardMaterial({ map: soldierCamoTex, color: 0xffffff, roughness: 0.85, bumpMap: soldierCamoTex, bumpScale: 0.015 }),
  soldierSkin: new THREE.MeshStandardMaterial({ color: 0xb58c69, roughness: 0.62 }),
  soldierVest: new THREE.MeshStandardMaterial({ color: 0x2c3324, roughness: 0.88 }),
  soldierKneepad: new THREE.MeshStandardMaterial({ color: 0x1c1e1a, roughness: 0.5, metalness: 0.5 }),
  heliFuselage: new THREE.MeshStandardMaterial({ map: darkSteelPlateTex, color: 0x2f3a2c, roughness: 0.5, metalness: 0.58, bumpMap: darkSteelPlateTex, bumpScale: 0.025 }),
  heliGlass: new THREE.MeshStandardMaterial({ color: COLORS.glass, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.85 }),
  rotorBlade: new THREE.MeshStandardMaterial({ color: 0x151718, roughness: 0.35, metalness: 0.75 }),
  parachute: new THREE.MeshStandardMaterial({ map: createStripedParachuteTexture(), roughness: 0.85, side: THREE.DoubleSide }),
  jetFuselage: new THREE.MeshStandardMaterial({ color: 0x5a6369, roughness: 0.35, metalness: 0.75 }),
  jetFlame: new THREE.MeshBasicMaterial({ color: 0xff6600 }),
  shrubLeaf: new THREE.MeshStandardMaterial({ color: 0x3d4f2c, roughness: 0.9 }),
  cables: new THREE.LineBasicMaterial({ color: 0xdddddd }),
  concrete: new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.94, metalness: 0.04, bumpMap: concreteTex, bumpScale: 0.06 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0x3e3c36, roughness: 0.94, metalness: 0.04 }),
  sandbags: new THREE.MeshStandardMaterial({ map: sandbagTex, color: 0xffffff, roughness: 0.94, bumpMap: sandbagTex, bumpScale: 0.05 }),
  steelDeck: new THREE.MeshStandardMaterial({ map: steelTreadTex, roughness: 0.55, metalness: 0.75 }),
  hazardSign: new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.5 }),
  woodCrate: new THREE.MeshStandardMaterial({ color: 0x484b35, roughness: 0.85 }),
  lensRed: new THREE.MeshStandardMaterial({ color: 0xff1111, roughness: 0.2, metalness: 0.8, emissive: 0x550000 }),
  lensGreen: new THREE.MeshBasicMaterial({ color: 0x00ff66 }),
};

/**
 * 1. Player's Anti-Air Gun Turret (Beach Head 360-Degree Moveable Redoubt Weapon)
 * Features dual 30mm heavy flak autocannons with fluted cooling shrouds, 105mm bunker cannon,
 * linked ammunition belts, hydraulic elevation pistons, armored gunner shield, and missile pods.
 */
export function createAntiAirGunTurret(): {
  turretGroup: THREE.Group;
  pitchGroup: THREE.Group;
  leftBarrel: THREE.Mesh;
  rightBarrel: THREE.Mesh;
  aaBarrelL2: THREE.Mesh;
  aaBarrelR2: THREE.Mesh;
  cannonL: THREE.Mesh;
  cannonR: THREE.Mesh;
  muzzlePoints: { left: THREE.Vector3; left2: THREE.Vector3; right2: THREE.Vector3; right: THREE.Vector3; center: THREE.Vector3; cannonL: THREE.Vector3; cannonR: THREE.Vector3; rocketL: THREE.Vector3; rocketR: THREE.Vector3 };
} {
  const turretGroup = new THREE.Group();
  turretGroup.name = 'player_turret_base';

  // 1. Heavy Traverse Ring & Foundation Gear
  const baseRingGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.5, 24);
  const baseRing = new THREE.Mesh(baseRingGeo, materials.darkSteel);
  baseRing.position.y = -1.25;
  turretGroup.add(baseRing);

  // Central Traverse Turret Pedestal (rotates with yaw)
  const pedestalGeo = new THREE.CylinderGeometry(1.85, 2.1, 0.85, 20);
  const pedestal = new THREE.Mesh(pedestalGeo, materials.armorSteel);
  pedestal.position.y = -0.6;
  turretGroup.add(pedestal);

  // Traverse hydraulic rotation motor & casing
  const motorGeo = new THREE.BoxGeometry(0.8, 0.6, 0.7);
  const motor = new THREE.Mesh(motorGeo, materials.darkSteel);
  motor.position.set(0.9, -0.6, 0.8);
  turretGroup.add(motor);

  // Gunner Footplate & Seat Assembly
  const footplateGeo = new THREE.BoxGeometry(1.5, 0.12, 1.2);
  const footplate = new THREE.Mesh(footplateGeo, materials.steelDeck);
  footplate.position.set(0, -0.4, 1.1);
  turretGroup.add(footplate);

  const seatSupportGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
  const seatSupport = new THREE.Mesh(seatSupportGeo, materials.darkSteel);
  seatSupport.position.set(0, -0.1, 1.2);
  turretGroup.add(seatSupport);

  const seatCushionGeo = new THREE.BoxGeometry(0.55, 0.12, 0.45);
  const seatCushion = new THREE.Mesh(seatCushionGeo, materials.rubberTire);
  seatCushion.position.set(0, 0.2, 1.2);
  turretGroup.add(seatCushion);

  // 2. Pitch Group (tilts up/down with crosshairs)
  const pitchGroup = new THREE.Group();
  pitchGroup.position.set(0, -0.4, 0);
  turretGroup.add(pitchGroup);

  // Heavy weapon housing / central mantlet (positioned low so it never blocks camera sightline)
  const mantletGeo = new THREE.BoxGeometry(2.0, 0.75, 1.8);
  const mantlet = new THREE.Mesh(mantletGeo, materials.darkSteel);
  mantlet.position.y = -0.2;
  pitchGroup.add(mantlet);

  // Armored front mantlet shield with angled ballistic cheeks
  const shieldGeo = new THREE.BoxGeometry(2.4, 0.75, 0.25);
  const shield = new THREE.Mesh(shieldGeo, materials.armorSteel);
  shield.position.set(0, -0.15, -1.05);
  pitchGroup.add(shield);

  // Hexagonal armor bolt studs on shield perimeter
  const studGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 6);
  studGeo.rotateX(Math.PI / 2);
  for (let sx = -1.2; sx <= 1.2; sx += 0.6) {
    for (let sy = -0.6; sy <= 0.6; sy += 0.6) {
      const stud = new THREE.Mesh(studGeo, materials.darkSteel);
      stud.position.set(sx, sy, -1.2);
      pitchGroup.add(stud);
    }
  }

  // Hydraulic Elevation Actuators (Left & Right pistons)
  const pistonCylinderGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.9, 10);
  pistonCylinderGeo.rotateX(Math.PI / 3);
  for (let side = -1; side <= 1; side += 2) {
    const piston = new THREE.Mesh(pistonCylinderGeo, materials.darkSteel);
    piston.position.set(side * 1.25, -0.45, 0.2);
    pitchGroup.add(piston);

    const rodGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.8, 8);
    rodGeo.rotateX(Math.PI / 3);
    const rod = new THREE.Mesh(rodGeo, materials.armorSteel);
    rod.position.set(side * 1.25, -0.25, 0.05);
    pitchGroup.add(rod);
  }

  // 3. TWO ZU-23-2 twin-barrel AA turret units: LEFT unit and RIGHT unit.
  //    Each unit carries a pair of 23mm barrels; every shot fires one side
  //    (left / right) alternately.

  // Build one twin-barrel ZU-23-2 unit centered at `cx`, returns its two barrels
  const buildZuUnit = (cx: number) => {
    const unitGroup = new THREE.Group();
    const unitBarrelGeo = new THREE.CylinderGeometry(0.085, 0.105, 3.0, 12);
    unitBarrelGeo.rotateX(Math.PI / 2);
    const b1 = new THREE.Mesh(unitBarrelGeo, materials.gunBarrel);
    b1.position.set(cx - 0.3, 0.28, -2.2);
    unitGroup.add(b1);
    const b2 = new THREE.Mesh(unitBarrelGeo, materials.gunBarrel);
    b2.position.set(cx + 0.3, 0.28, -2.2);
    unitGroup.add(b2);
    // shrouds
    const shroudGeo = new THREE.CylinderGeometry(0.13, 0.13, 1.9, 12, 1, true);
    shroudGeo.rotateX(Math.PI / 2);
    for (const bx of [cx - 0.3, cx + 0.3]) {
      const shroud = new THREE.Mesh(shroudGeo, materials.darkSteel);
      shroud.position.set(bx, 0.28, -2.15);
      unitGroup.add(shroud);
    }
    // muzzle brakes
    const brakeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 12);
    brakeGeo.rotateX(Math.PI / 2);
    for (const bx of [cx - 0.3, cx + 0.3]) {
      const brake = new THREE.Mesh(brakeGeo, materials.darkSteel);
      brake.position.set(bx, 0.28, -3.95);
      unitGroup.add(brake);
    }
    // ZU carriage mount box (each unit looks like its own separate gun)
    const cradleGeo = new THREE.BoxGeometry(0.9, 0.4, 1.1);
    const cradle = new THREE.Mesh(cradleGeo, materials.armorSteel);
    cradle.position.set(cx, 0.05, -1.3);
    unitGroup.add(cradle);
    // per-unit ammo box feed
    const feedGeo = new THREE.BoxGeometry(0.5, 0.45, 0.5);
    const feed = new THREE.Mesh(feedGeo, materials.darkSteel);
    feed.position.set(cx, 0.05, -0.7);
    unitGroup.add(feed);
    return { b1, b2, unitGroup };
  };

  const zuL = buildZuUnit(-1.35);
  const zuR = buildZuUnit(1.35);
  const leftBarrel = zuL.b1;
  const rightBarrel = zuR.b1;
  const aaBarrelL2 = zuL.b2;
  const aaBarrelR2 = zuR.b2;
  zuL.unitGroup.name = 'zu_left_unit';
  zuR.unitGroup.name = 'zu_right_unit';
  pitchGroup.add(zuL.unitGroup);
  pitchGroup.add(zuR.unitGroup);

  // 4. TWO 105mm heavy cannons: LEFT cannon + RIGHT cannon (fire alternately).
  const heavyBarrelGeo = new THREE.CylinderGeometry(0.2, 0.24, 4.2, 16);
  heavyBarrelGeo.rotateX(Math.PI / 2);
  const buildCannon = (cx: number): THREE.Mesh => {
    const cannonBarrel = new THREE.Mesh(heavyBarrelGeo, materials.gunBarrel);
    cannonBarrel.position.set(cx, -0.25, -2.4);
    pitchGroup.add(cannonBarrel);
    // recoil damper cylinder
    const recoilGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.8, 10);
    recoilGeo.rotateX(Math.PI / 2);
    const damper = new THREE.Mesh(recoilGeo, materials.darkSteel);
    damper.position.set(cx, 0.06, -1.8);
    pitchGroup.add(damper);
    // muzzle brake
    const hBrakeGeo = new THREE.BoxGeometry(0.5, 0.4, 0.65);
    const hBrake = new THREE.Mesh(hBrakeGeo, materials.darkSteel);
    hBrake.position.set(cx, -0.25, -4.4);
    pitchGroup.add(hBrake);
    return cannonBarrel;
  };
  const cannonL = buildCannon(-0.62);
  const cannonR = buildCannon(0.62);

  // 5. Twin Ammunition Drums & Linked Feed Chutes (between the ZU units)
  const drumGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.75, 18);
  drumGeo.rotateZ(Math.PI / 2);
  const drumL = new THREE.Mesh(drumGeo, materials.darkSteel);
  drumL.position.set(-1.3, -0.15, 0.25);
  pitchGroup.add(drumL);

  const drumR = new THREE.Mesh(drumGeo, materials.darkSteel);
  drumR.position.set(1.3, -0.15, 0.25);
  pitchGroup.add(drumR);

  // Curved ammo feed chutes connecting drums to autocannon breeches
  const chuteGeo = new THREE.BoxGeometry(0.18, 0.12, 0.9);
  const chuteL = new THREE.Mesh(chuteGeo, materials.brass);
  chuteL.position.set(-1.05, 0.05, -0.4);
  chuteL.rotation.y = 0.25;
  pitchGroup.add(chuteL);

  const chuteR = new THREE.Mesh(chuteGeo, materials.brass);
  chuteR.position.set(1.05, 0.05, -0.4);
  chuteR.rotation.y = -0.25;
  pitchGroup.add(chuteR);

  // 6. Left & Right Missile Pods (Surface-to-Air / Anti-Tank)
  const podGeo = new THREE.BoxGeometry(0.75, 0.75, 1.9);
  const podLeft = new THREE.Mesh(podGeo, materials.tankGreen);
  podLeft.position.set(-1.8, 0.4, -0.6);
  pitchGroup.add(podLeft);

  const podRight = new THREE.Mesh(podGeo, materials.tankGreen);
  podRight.position.set(1.8, 0.4, -0.6);
  pitchGroup.add(podRight);

  // 4 Rocket tube openings per pod with visible rocket warheads
  for (let i = -0.2; i <= 0.2; i += 0.4) {
    for (let j = -0.2; j <= 0.2; j += 0.4) {
      const tubeCapGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 10);
      tubeCapGeo.rotateX(Math.PI / 2);
      const capL = new THREE.Mesh(tubeCapGeo, materials.darkSteel);
      capL.position.set(-1.8 + i, 0.4 + j, -1.55);
      pitchGroup.add(capL);

      const capR = new THREE.Mesh(tubeCapGeo, materials.darkSteel);
      capR.position.set(1.8 + i, 0.4 + j, -1.55);
      pitchGroup.add(capR);

      // Conical missile noses visible inside tubes
      const noseGeo = new THREE.ConeGeometry(0.09, 0.22, 8);
      noseGeo.rotateX(-Math.PI / 2);
      const noseL = new THREE.Mesh(noseGeo, materials.lensRed);
      noseL.position.set(-1.8 + i, 0.4 + j, -1.54);
      pitchGroup.add(noseL);

      const noseR = new THREE.Mesh(noseGeo, materials.lensRed);
      noseR.position.set(1.8 + i, 0.4 + j, -1.54);
      pitchGroup.add(noseR);
    }
  }

  // 7. Gunner Sighting Optics Box & Periscope (positioned low below sightline)
  const sightGeo = new THREE.BoxGeometry(0.32, 0.24, 0.7);
  const sight = new THREE.Mesh(sightGeo, materials.darkSteel);
  sight.position.set(0.68, 0.18, -0.6);
  pitchGroup.add(sight);

  const opticLensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 12);
  opticLensGeo.rotateX(Math.PI / 2);
  const opticLens = new THREE.Mesh(opticLensGeo, materials.heliGlass);
  opticLens.position.set(0.68, 0.18, -0.96);
  pitchGroup.add(opticLens);

  // Twin Gunner Control Handles (spade grips with dual triggers)
  const crossbarGeo = new THREE.BoxGeometry(0.48, 0.05, 0.05);
  const crossbar = new THREE.Mesh(crossbarGeo, materials.darkSteel);
  crossbar.position.set(0, 0.15, 0.7);
  pitchGroup.add(crossbar);

  for (let g = -1; g <= 1; g += 2) {
    const gripGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8);
    const grip = new THREE.Mesh(gripGeo, materials.rubberTire);
    grip.position.set(g * 0.24, 0.1, 0.7);
    pitchGroup.add(grip);
  }

  return {
    turretGroup,
    pitchGroup,
    leftBarrel,
    rightBarrel,
    aaBarrelL2,
    aaBarrelR2,
    cannonL,
    cannonR,
    muzzlePoints: {
      // AA left unit: outer & inner 23mm barrels
      left: new THREE.Vector3(-1.65, 0.28, -4.0),
      left2: new THREE.Vector3(-1.05, 0.28, -4.0),
      // AA right unit: inner & outer 23mm barrels
      right2: new THREE.Vector3(1.05, 0.28, -4.0),
      right: new THREE.Vector3(1.65, 0.28, -4.0),
      // handgun fallback flash point near the deck
      center: new THREE.Vector3(0, -0.2, -4.6),
      // 105mm cannons: left & right (alternate per shot)
      cannonL: new THREE.Vector3(-0.62, -0.25, -4.5),
      cannonR: new THREE.Vector3(0.62, -0.25, -4.5),
      rocketL: new THREE.Vector3(-1.8, 0.0, -1.6),
      rocketR: new THREE.Vector3(1.8, 0.0, -1.6),
    },
  };
}

/**
 * 2. 3D Soldier Model (High-Level Tactical Infantry)
 * Features modern ballistic FAST helmet with NVG mount, tactical plate carrier with pouches,
 * articulated elbows and knees, combat boots, and assault rifle with curved magazine and sights.
 */
export function createSoldierModel(): {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  rifle: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'soldier';
  group.scale.set(1.85, 1.85, 1.85);

  // 1. Soldier Torso & Tactical Plate Carrier
  const torsoGeo = new THREE.BoxGeometry(0.56, 0.78, 0.36);
  const torso = new THREE.Mesh(torsoGeo, materials.camoSoldier);
  torso.position.y = 1.05;
  group.add(torso);

  // Modular MOLLE Tactical Plate Carrier (front and rear ceramic plates)
  const vestGeo = new THREE.BoxGeometry(0.62, 0.68, 0.44);
  const vest = new THREE.Mesh(vestGeo, materials.soldierVest);
  vest.position.set(0, 1.08, 0.02);
  group.add(vest);

  // Chest Magazine Pouches (3 rifle mags)
  const pouchGeo = new THREE.BoxGeometry(0.14, 0.24, 0.11);
  for (let p = -0.16; p <= 0.16; p += 0.16) {
    const pouch = new THREE.Mesh(pouchGeo, materials.soldierVest);
    pouch.position.set(p, 0.96, 0.27);
    group.add(pouch);
  }

  // Comms Radio Pouch on Left Shoulder with Antenna
  const radioGeo = new THREE.BoxGeometry(0.12, 0.2, 0.1);
  const radio = new THREE.Mesh(radioGeo, materials.darkSteel);
  radio.position.set(-0.25, 1.25, 0.15);
  group.add(radio);

  const antennaGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 6);
  const antenna = new THREE.Mesh(antennaGeo, materials.darkSteel);
  antenna.position.set(-0.25, 1.5, 0.15);
  group.add(antenna);

  // 2. Sculpted Head, Balaclava & Ballistic Helmet
  const headGeo = new THREE.SphereGeometry(0.2, 12, 12);
  const head = new THREE.Mesh(headGeo, materials.soldierSkin);
  head.position.set(0, 1.6, 0);
  group.add(head);

  // Modern FAST Combat Helmet with side accessory rails
  const helmetGeo = new THREE.SphereGeometry(0.24, 14, 12, 0, Math.PI * 2, 0, Math.PI / 1.7);
  const helmet = new THREE.Mesh(helmetGeo, materials.camoSoldier);
  helmet.position.set(0, 1.65, 0);
  group.add(helmet);

  // Helmet Night Vision Goggle (NVG) Mount on forehead
  const nvgMountGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
  const nvgMount = new THREE.Mesh(nvgMountGeo, materials.darkSteel);
  nvgMount.position.set(0, 1.72, 0.23);
  group.add(nvgMount);

  // Ballistic Combat Goggles with Amber/Dark Lens
  const gogglesGeo = new THREE.BoxGeometry(0.28, 0.09, 0.12);
  const goggles = new THREE.Mesh(gogglesGeo, materials.darkSteel);
  goggles.position.set(0, 1.62, 0.18);
  group.add(goggles);

  const lensGeo = new THREE.BoxGeometry(0.25, 0.06, 0.02);
  const lens = new THREE.Mesh(lensGeo, materials.heliGlass);
  lens.position.set(0, 1.62, 0.245);
  group.add(lens);

  // 3. Articulated Legs with Tactical Kneepads & Combat Boots
  const thighGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.72, 8);
  const bootGeo = new THREE.BoxGeometry(0.18, 0.18, 0.26);
  const kneepadGeo = new THREE.BoxGeometry(0.14, 0.14, 0.08);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.19, 0.7, 0);

  const thighL = new THREE.Mesh(thighGeo, materials.camoSoldier);
  thighL.position.y = -0.36;
  leftLeg.add(thighL);

  const kneepadL = new THREE.Mesh(kneepadGeo, materials.soldierKneepad);
  kneepadL.position.set(0, -0.4, 0.1);
  leftLeg.add(kneepadL);

  const bootL = new THREE.Mesh(bootGeo, materials.soldierKneepad);
  bootL.position.set(0, -0.7, 0.04);
  leftLeg.add(bootL);
  group.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.19, 0.7, 0);

  const thighR = new THREE.Mesh(thighGeo, materials.camoSoldier);
  thighR.position.y = -0.36;
  rightLeg.add(thighR);

  const kneepadR = new THREE.Mesh(kneepadGeo, materials.soldierKneepad);
  kneepadR.position.set(0, -0.4, 0.1);
  rightLeg.add(kneepadR);

  const bootR = new THREE.Mesh(bootGeo, materials.soldierKneepad);
  bootR.position.set(0, -0.7, 0.04);
  rightLeg.add(bootR);
  group.add(rightLeg);

  // 4. Arms and Assault Rifle
  const rifle = new THREE.Group();

  // Receiver & Upper Rail
  const gunBodyGeo = new THREE.BoxGeometry(0.09, 0.14, 0.78);
  const gunBody = new THREE.Mesh(gunBodyGeo, materials.darkSteel);
  rifle.add(gunBody);

  // Fluted Rifled Barrel & Flash Suppressor
  const gunBarrelGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.46, 8);
  gunBarrelGeo.rotateX(Math.PI / 2);
  const gunBarrel = new THREE.Mesh(gunBarrelGeo, materials.gunBarrel);
  gunBarrel.position.set(0, 0.02, 0.6);
  rifle.add(gunBarrel);

  const flashHiderGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.08, 6);
  flashHiderGeo.rotateX(Math.PI / 2);
  const flashHider = new THREE.Mesh(flashHiderGeo, materials.darkSteel);
  flashHider.position.set(0, 0.02, 0.85);
  rifle.add(flashHider);

  // Curved 30-round Banana Magazine
  const magGeo = new THREE.BoxGeometry(0.07, 0.24, 0.16);
  magGeo.rotateX(Math.PI / 8);
  const magazine = new THREE.Mesh(magGeo, materials.gunBarrel);
  magazine.position.set(0, -0.16, 0.1);
  rifle.add(magazine);

  // Optical Red-Dot Sight / Optic on Top Rail
  const opticGeo = new THREE.BoxGeometry(0.06, 0.08, 0.16);
  const optic = new THREE.Mesh(opticGeo, materials.darkSteel);
  optic.position.set(0, 0.11, 0.05);
  rifle.add(optic);

  // Handguard with Ventilation Holes
  const handguardGeo = new THREE.BoxGeometry(0.1, 0.11, 0.32);
  const handguard = new THREE.Mesh(handguardGeo, materials.soldierVest);
  handguard.position.set(0, 0.02, 0.4);
  rifle.add(handguard);

  rifle.position.set(0.16, 1.15, 0.46);
  rifle.rotation.y = -0.12;
  group.add(rifle);

  // Articulated Arms holding rifle
  const armGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.62, 8);
  armGeo.rotateZ(Math.PI / 4);

  const armL = new THREE.Mesh(armGeo, materials.camoSoldier);
  armL.position.set(-0.35, 1.15, 0.2);
  group.add(armL);

  const armR = new THREE.Mesh(armGeo, materials.camoSoldier);
  armR.position.set(0.35, 1.15, 0.2);
  armR.rotation.y = -0.3;
  group.add(armR);

  return { group, leftLeg, rightLeg, rifle };
}

/**
 * 3. 3D Tank Model (High-Level Main Battle Tank)
 * Features composite sloped glacis, 6 pairs of road wheels with suspension arms,
 * segmented tread tracks, reactive armor (ERA) bricks, low-profile turret,
 * commander cupola with 12.7mm machine gun, smoke dischargers, and 120mm rifled cannon.
 */
export function createTankModel(): {
  group: THREE.Group;
  turret: THREE.Group;
  cannon: THREE.Group;
  wheels: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.name = 'tank';
  group.scale.set(1.45, 1.45, 1.45);

  // 1. Lower Hull Base & Sloped Armor Glacis
  const hullLowerGeo = new THREE.BoxGeometry(3.6, 0.95, 6.4);
  const hullLower = new THREE.Mesh(hullLowerGeo, materials.tankGreen);
  hullLower.position.y = 1.05;
  group.add(hullLower);

  // Sloped Front Glacis Plate
  const glacisGeo = new THREE.BoxGeometry(3.6, 0.85, 2.1);
  glacisGeo.rotateX(Math.PI / 4.8);
  const glacis = new THREE.Mesh(glacisGeo, materials.tankGreen);
  glacis.position.set(0, 1.3, 2.9);
  group.add(glacis);

  // Driver Vision Periscopes on glacis
  const periscopeGeo = new THREE.BoxGeometry(0.3, 0.15, 0.2);
  const periscope = new THREE.Mesh(periscopeGeo, materials.darkSteel);
  periscope.position.set(-0.4, 1.65, 2.3);
  group.add(periscope);

  // V-shaped Front Wave Deflector / Splash Guard
  const splashGeo = new THREE.BoxGeometry(2.4, 0.12, 0.2);
  const splash = new THREE.Mesh(splashGeo, materials.darkSteel);
  splash.position.set(0, 1.45, 3.4);
  group.add(splash);

  // Headlights with protective steel cages
  const lightGeo = new THREE.BoxGeometry(0.24, 0.24, 0.2);
  for (let side = -1; side <= 1; side += 2) {
    const light = new THREE.Mesh(lightGeo, materials.darkSteel);
    light.position.set(side * 1.4, 1.4, 3.6);
    group.add(light);

    const lightLens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), materials.brass);
    lightLens.rotation.x = Math.PI / 2;
    lightLens.position.set(side * 1.4, 1.4, 3.72);
    group.add(lightLens);
  }

  // 2. Articulated Track Treads (Left and Right)
  const trackGeo = new THREE.BoxGeometry(0.72, 1.1, 6.6);
  const trackL = new THREE.Mesh(trackGeo, materials.tracks);
  trackL.position.set(-2.05, 0.78, 0);
  group.add(trackL);

  const trackR = new THREE.Mesh(trackGeo, materials.tracks);
  trackR.position.set(2.05, 0.78, 0);
  group.add(trackR);

  // Heavy Armored Side Skirts with Reactive Armor (ERA) tiles
  const skirtGeo = new THREE.BoxGeometry(0.14, 0.85, 5.8);
  const skirtL = new THREE.Mesh(skirtGeo, materials.tankGreen);
  skirtL.position.set(-2.45, 0.95, 0);
  group.add(skirtL);

  const skirtR = new THREE.Mesh(skirtGeo, materials.tankGreen);
  skirtR.position.set(2.45, 0.95, 0);
  group.add(skirtR);

  // Mudflaps on rear & front of skirts
  const flapGeo = new THREE.BoxGeometry(0.72, 0.45, 0.08);
  for (let side = -1; side <= 1; side += 2) {
    const flapF = new THREE.Mesh(flapGeo, materials.rubberTire);
    flapF.position.set(side * 2.05, 0.7, 3.35);
    group.add(flapF);

    const flapR = new THREE.Mesh(flapGeo, materials.rubberTire);
    flapR.position.set(side * 2.05, 0.7, -3.35);
    group.add(flapR);
  }

  // 3. Road Wheels (6 Dual Pairs) + Front Idler + Rear Drive Sprockets
  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.72, 14);
  wheelGeo.rotateZ(Math.PI / 2);

  for (let z = -2.3; z <= 2.3; z += 0.92) {
    // Left Wheel
    const wheelL = new THREE.Mesh(wheelGeo, materials.darkSteel);
    wheelL.position.set(-2.05, 0.52, z);
    const rimL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.74, 8), materials.tankGreen);
    rimL.rotation.z = Math.PI / 2;
    wheelL.add(rimL);
    group.add(wheelL);
    wheels.push(wheelL);

    // Right Wheel
    const wheelR = new THREE.Mesh(wheelGeo, materials.darkSteel);
    wheelR.position.set(2.05, 0.52, z);
    const rimR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.74, 8), materials.tankGreen);
    rimR.rotation.z = Math.PI / 2;
    wheelR.add(rimR);
    group.add(wheelR);
    wheels.push(wheelR);
  }

  // Front Idler Wheels
  const idlerGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.72, 12);
  idlerGeo.rotateZ(Math.PI / 2);
  for (let side = -1; side <= 1; side += 2) {
    const idler = new THREE.Mesh(idlerGeo, materials.darkSteel);
    idler.position.set(side * 2.05, 0.8, 3.0);
    group.add(idler);

    // Rear Drive Sprocket with Teeth
    const sprocket = new THREE.Mesh(idlerGeo, materials.darkSteel);
    sprocket.position.set(side * 2.05, 0.8, -3.0);
    group.add(sprocket);
  }

  // Reactive Armor (ERA) tiles on glacis
  const eraGlacisGeo = new THREE.BoxGeometry(0.48, 0.16, 0.32);
  for (let x = -1.3; x <= 1.3; x += 0.55) {
    const era = new THREE.Mesh(eraGlacisGeo, materials.tankCamoSand);
    era.position.set(x, 1.62, 2.35);
    era.rotation.x = Math.PI / 4.8;
    group.add(era);
  }

  // Auxiliary Rear Cylindrical Fuel Drums
  const fuelDrumGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.4, 12);
  fuelDrumGeo.rotateZ(Math.PI / 2);
  for (let f = -1; f <= 1; f += 2) {
    const drum = new THREE.Mesh(fuelDrumGeo, materials.tankGreen);
    drum.position.set(f * 1.0, 1.3, -3.45);
    group.add(drum);
  }

  // 4. Rotating Cast Angular Turret
  const turret = new THREE.Group();
  turret.position.set(0, 1.68, 0.25);

  // Turret Ring & Base
  const turretBaseGeo = new THREE.CylinderGeometry(1.65, 1.85, 0.65, 18);
  const turretBase = new THREE.Mesh(turretBaseGeo, materials.tankGreen);
  turret.add(turretBase);

  // Angular Wedge Armor Cheeks (Kontakt-5 ERA arrow shape)
  const cheekGeo = new THREE.BoxGeometry(2.9, 0.75, 2.5);
  const cheek = new THREE.Mesh(cheekGeo, materials.tankGreen);
  cheek.position.set(0, 0.32, 0.15);
  turret.add(cheek);

  // Wedge Reactive Armor Blocks on Cheeks
  const wedgeGeo = new THREE.BoxGeometry(1.1, 0.35, 0.9);
  for (let s = -1; s <= 1; s += 2) {
    const wedge = new THREE.Mesh(wedgeGeo, materials.tankCamoSand);
    wedge.position.set(s * 0.95, 0.45, 1.05);
    wedge.rotation.y = s * -0.28;
    turret.add(wedge);
  }

  // Commander Cupola & Hatch
  const cupolaGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.38, 14);
  const cupola = new THREE.Mesh(cupolaGeo, materials.darkSteel);
  cupola.position.set(0.7, 0.8, -0.45);
  turret.add(cupola);

  // Pintle-mounted 12.7mm Heavy Anti-Aircraft Machine Gun
  const mgGeo = new THREE.BoxGeometry(0.14, 0.16, 0.75);
  const mg = new THREE.Mesh(mgGeo, materials.gunBarrel);
  mg.position.set(0.7, 1.12, -0.45);
  turret.add(mg);

  const mgBarrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
  mgBarrelGeo.rotateX(Math.PI / 2);
  const mgBarrel = new THREE.Mesh(mgBarrelGeo, materials.gunBarrel);
  mgBarrel.position.set(0.7, 1.12, 0.05);
  turret.add(mgBarrel);

  // Gunner Primary Sight Box
  const gunnerSightGeo = new THREE.BoxGeometry(0.35, 0.3, 0.4);
  const gunnerSight = new THREE.Mesh(gunnerSightGeo, materials.darkSteel);
  gunnerSight.position.set(-0.7, 0.75, 0.5);
  turret.add(gunnerSight);

  // Quad Smoke Grenade Dischargers (cheeks)
  const smokeTubeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 8);
  smokeTubeGeo.rotateX(Math.PI / 3);
  for (let s = -1; s <= 1; s += 2) {
    for (let k = -0.22; k <= 0.22; k += 0.22) {
      const smk = new THREE.Mesh(smokeTubeGeo, materials.darkSteel);
      smk.position.set(s * 1.45, 0.65, k + 0.3);
      smk.rotation.y = s * 0.45;
      turret.add(smk);
    }
  }

  // 5. Elevating Cannon Assembly (120mm Gun)
  const cannon = new THREE.Group();
  cannon.position.set(0, 0.3, 1.25);

  // Armored Gun Mantlet Collar
  const mantletGeo = new THREE.BoxGeometry(0.85, 0.65, 0.65);
  const mantlet = new THREE.Mesh(mantletGeo, materials.darkSteel);
  cannon.add(mantlet);

  // Main 120mm Gun Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.14, 0.18, 4.8, 14);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, materials.gunBarrel);
  barrel.position.set(0, 0, 2.4);
  cannon.add(barrel);

  // Concentric Thermal Bore Evacuator Sleeve
  const sleeveGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.95, 12);
  sleeveGeo.rotateX(Math.PI / 2);
  const sleeve = new THREE.Mesh(sleeveGeo, materials.tankGreen);
  sleeve.position.set(0, 0, 2.65);
  cannon.add(sleeve);

  // Double-Baffle Muzzle Brake
  const muzzleGeo = new THREE.BoxGeometry(0.38, 0.32, 0.45);
  const muzzle = new THREE.Mesh(muzzleGeo, materials.darkSteel);
  muzzle.position.set(0, 0, 4.8);
  cannon.add(muzzle);

  turret.add(cannon);
  group.add(turret);

  return { group, turret, cannon, wheels };
}

/**
 * 3b. 3D Wheeled Armored Personnel Carrier (High-Level 8-Wheel APC)
 * Features boat-shaped V-hull, 8 large tactical off-road tires with rim bolts,
 * troop ingress doors, and 30mm rapid autocannon turret with searchlight.
 */
export function createAPCModel(): {
  group: THREE.Group;
  turret: THREE.Group;
  cannon: THREE.Mesh;
  wheels: THREE.Mesh[];
} {
  const group = new THREE.Group();
  group.name = 'apc_vehicle';
  group.scale.set(1.45, 1.45, 1.45);

  // 1. Lower Blast-Deflection Boat Chassis
  const lowerHullGeo = new THREE.BoxGeometry(2.4, 0.75, 5.4);
  const lowerHull = new THREE.Mesh(lowerHullGeo, materials.darkSteel);
  lowerHull.position.y = 0.78;
  group.add(lowerHull);

  // 2. Sloped Upper Armored Hull (amphibious BTR style)
  const upperHullGeo = new THREE.BoxGeometry(2.65, 0.85, 5.2);
  const upperHull = new THREE.Mesh(upperHullGeo, materials.apcHull);
  upperHull.position.set(0, 1.3, -0.1);
  group.add(upperHull);

  // Front sloped glacis
  const frontGlacisGeo = new THREE.BoxGeometry(2.55, 0.75, 1.6);
  frontGlacisGeo.rotateX(Math.PI / 4.2);
  const frontGlacis = new THREE.Mesh(frontGlacisGeo, materials.apcHull);
  frontGlacis.position.set(0, 1.15, 2.4);
  group.add(frontGlacis);

  // Rear double troop doors
  const doorGeo = new THREE.BoxGeometry(1.9, 0.85, 0.15);
  const door = new THREE.Mesh(doorGeo, materials.darkSteel);
  door.position.set(0, 1.15, -2.7);
  group.add(door);

  // 3. 8 Large Heavy-Duty Off-Road Wheels with Directional Mud Treads
  const wheels: THREE.Mesh[] = [];
  const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  tireGeo.rotateZ(Math.PI / 2);

  const wheelPositionsZ = [-1.85, -0.62, 0.62, 1.85];
  for (const z of wheelPositionsZ) {
    // Left Wheel
    const wheelL = new THREE.Mesh(tireGeo, materials.rubberTire);
    wheelL.position.set(-1.48, 0.52, z);
    const rimL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 8), materials.darkSteel);
    rimL.rotation.z = Math.PI / 2;
    wheelL.add(rimL);
    group.add(wheelL);
    wheels.push(wheelL);

    // Right Wheel
    const wheelR = new THREE.Mesh(tireGeo, materials.rubberTire);
    wheelR.position.set(1.48, 0.52, z);
    const rimR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.42, 8), materials.darkSteel);
    rimR.rotation.z = Math.PI / 2;
    wheelR.add(rimR);
    group.add(wheelR);
    wheels.push(wheelR);
  }

  // 4. Low-Profile Rotating Autocannon Turret
  const turret = new THREE.Group();
  turret.position.set(0, 1.82, 0.35);

  const turretDomeGeo = new THREE.CylinderGeometry(0.8, 0.95, 0.48, 14);
  const turretDome = new THREE.Mesh(turretDomeGeo, materials.apcHull);
  turret.add(turretDome);

  // Commander vision cupola
  const cupolaGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.22, 10);
  const cupola = new THREE.Mesh(cupolaGeo, materials.darkSteel);
  cupola.position.set(0.28, 0.32, -0.16);
  turret.add(cupola);

  // High-velocity 30mm Autocannon Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.065, 0.085, 2.7, 10);
  barrelGeo.rotateX(Math.PI / 2);
  const cannon = new THREE.Mesh(barrelGeo, materials.gunBarrel);
  cannon.position.set(-0.16, 0.14, 1.35);
  turret.add(cannon);

  // Muzzle brake
  const brakeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.28, 8);
  brakeGeo.rotateX(Math.PI / 2);
  const brake = new THREE.Mesh(brakeGeo, materials.darkSteel);
  brake.position.set(-0.16, 0.14, 2.7);
  turret.add(brake);

  group.add(turret);

  return { group, turret, cannon, wheels };
}

/**
 * 3c. 3D Allied Fighter Jet (Airstrike Support - B Key)
 */
export function createJetModel(): {
  group: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'allied_fighter_jet';
  group.scale.set(1.5, 1.5, 1.5);

  const bodyGeo = new THREE.ConeGeometry(0.65, 7.0, 12);
  bodyGeo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, materials.jetFuselage);
  group.add(body);

  const canopyGeo = new THREE.SphereGeometry(0.35, 10, 8);
  canopyGeo.scale(0.8, 0.9, 2.0);
  const canopy = new THREE.Mesh(canopyGeo, materials.heliGlass);
  canopy.position.set(0, 0.38, 0.8);
  group.add(canopy);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2.9, -1.9);
  wingShape.lineTo(2.6, -2.5);
  wingShape.lineTo(0, -1.7);
  wingShape.closePath();

  const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.06, bevelEnabled: false });
  wingExtrude.rotateX(Math.PI / 2);

  const rightWing = new THREE.Mesh(wingExtrude, materials.jetFuselage);
  rightWing.position.set(0.3, 0, 0.2);
  group.add(rightWing);

  const leftWing = new THREE.Mesh(wingExtrude, materials.jetFuselage);
  leftWing.scale.x = -1;
  leftWing.position.set(-0.3, 0, 0.2);
  group.add(leftWing);

  const tailGeo = new THREE.BoxGeometry(0.06, 1.1, 1.2);
  const tailL = new THREE.Mesh(tailGeo, materials.jetFuselage);
  tailL.position.set(-0.55, 0.65, -2.3);
  tailL.rotation.z = -0.22;
  group.add(tailL);

  const tailR = new THREE.Mesh(tailGeo, materials.jetFuselage);
  tailR.position.set(0.55, 0.65, -2.3);
  tailR.rotation.z = 0.22;
  group.add(tailR);

  const exhaustGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.5, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaust = new THREE.Mesh(exhaustGeo, materials.darkSteel);
  exhaust.position.set(0, 0, -3.5);
  group.add(exhaust);

  const flameGeo = new THREE.ConeGeometry(0.32, 1.5, 8);
  flameGeo.rotateX(Math.PI / 2);
  const flame = new THREE.Mesh(flameGeo, materials.jetFlame);
  flame.position.set(0, 0, -4.2);
  group.add(flame);

  return { group };
}

/**
 * Enemy fighter jet: same silhouette as the allied jet but with a hostile
 * dark livery so it's visually distinct in the sky.
 */
export function createEnemyJetModel(): { group: THREE.Group } {
  const { group } = createJetModel();
  group.name = 'enemy_fighter_jet';
  const enemyJetMat = new THREE.MeshStandardMaterial({ color: 0x2e3a2f, roughness: 0.4, metalness: 0.7 });
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.material !== materials.jetFlame && mesh.material !== materials.heliGlass) {
      mesh.material = enemyJetMat;
    }
  });
  return { group };
}

/**
 * Shaheen kamikaze drone: a small fixed-wing loitering munition that homes
 * onto a target and detonates on impact.
 */
export function createShaheenDroneModel(): { group: THREE.Group } {
  const group = new THREE.Group();
  group.name = 'shaheen_drone';
  group.scale.set(1.1, 1.1, 1.1);

  // Fuselage (compact body)
  const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 2.4, 10);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, materials.darkSteel);
  group.add(body);

  // Nose cone (warhead tip)
  const noseGeo = new THREE.ConeGeometry(0.22, 0.6, 10);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, materials.lensRed);
  nose.position.set(0, 0, 1.5);
  group.add(nose);

  // Delta wings
  const wingGeo = new THREE.BoxGeometry(3.0, 0.08, 0.8);
  const wings = new THREE.Mesh(wingGeo, materials.tankGreen);
  wings.position.set(0, 0.1, 0.6);
  group.add(wings);

  // Tail fins (V-tail)
  const finGeo = new THREE.BoxGeometry(0.55, 0.02, 0.8);
  const finL = new THREE.Mesh(finGeo, materials.darkSteel);
  finL.position.set(-0.35, 0.4, -1.1);
  finL.rotation.z = 0.4;
  group.add(finL);
  const finR = new THREE.Mesh(finGeo, materials.darkSteel);
  finR.position.set(0.35, 0.4, -1.1);
  finR.rotation.z = -0.4;
  group.add(finR);

  // Rear pusher prop (small)
  const propGeo = new THREE.BoxGeometry(0.05, 1.3, 0.05);
  const prop = new THREE.Mesh(propGeo, materials.darkSteel);
  prop.position.set(0, 0, -1.35);
  group.add(prop);

  // Warhead casing stripe (orange)
  const stripeGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.3, 10);
  stripeGeo.rotateX(Math.PI / 2);
  const stripe = new THREE.Mesh(stripeGeo, materials.jetFlame);
  stripe.position.set(0, 0, 0.5);
  group.add(stripe);

  return { group };
}

/**
 * Cargo transport plane: high-wing troop carrier that drops paratroopers.
 */
export function createTransportPlaneModel(): { group: THREE.Group } {
  const group = new THREE.Group();
  group.name = 'enemy_cargo_plane';
  group.scale.set(1.6, 1.6, 1.6);

  // Fuselage
  const bodyGeo = new THREE.CylinderGeometry(1.0, 0.9, 14, 10);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, materials.apcHull);
  group.add(body);

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(0.9, 2.2, 10);
  noseGeo.rotateX(Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, materials.heliGlass);
  nose.position.set(0, 0, 8.0);
  group.add(nose);

  // Tail
  const tailGeo = new THREE.ConeGeometry(0.6, 3.5, 8);
  tailGeo.rotateX(-Math.PI / 2);
  const tail = new THREE.Mesh(tailGeo, materials.apcHull);
  tail.position.set(0, 0.6, -8.0);
  group.add(tail);

  // High wings
  const wingGeo = new THREE.BoxGeometry(12, 0.25, 3.2);
  const wing = new THREE.Mesh(wingGeo, materials.tankGreen);
  wing.position.set(0, 1.6, 0.5);
  group.add(wing);

  // Engines under wings
  const engineGeo = new THREE.CylinderGeometry(0.55, 0.55, 3.0, 10);
  engineGeo.rotateX(Math.PI / 2);
  for (const ex of [-4.0, 4.0]) {
    const engine = new THREE.Mesh(engineGeo, materials.darkSteel);
    engine.position.set(ex, 0.8, 0.8);
    group.add(engine);
    const propGeo = new THREE.BoxGeometry(0.15, 3.2, 0.05);
    const prop = new THREE.Mesh(propGeo, materials.darkSteel);
    prop.position.set(ex, 0.8, 2.4);
    group.add(prop);
  }

  // Tail fin
  const finGeo = new THREE.BoxGeometry(0.25, 3.5, 2.5);
  const fin = new THREE.Mesh(finGeo, materials.tankGreen);
  fin.position.set(0, 2.2, -7.5);
  group.add(fin);

  // Rear cargo ramp (open, troops exit here)
  const rampGeo = new THREE.BoxGeometry(2.0, 0.25, 1.6);
  const ramp = new THREE.Mesh(rampGeo, materials.darkSteel);
  ramp.position.set(0, -0.4, -7.0);
  ramp.rotation.x = -0.5;
  group.add(ramp);

  return { group };
}

/**
 * 4. 3D Attack Helicopter Model (High-Level Gunship - Mi-24 / Apache Style)
 */
export function createHelicopterModel(): {
  group: THREE.Group;
  mainRotor: THREE.Group;
  tailRotor: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'helicopter';
  group.scale.set(1.55, 1.55, 1.55);

  // 1. Aerodynamic Chiseled Gunship Fuselage
  const fuselageGeo = new THREE.BoxGeometry(1.85, 2.15, 7.8);
  const fuselage = new THREE.Mesh(fuselageGeo, materials.heliFuselage);
  group.add(fuselage);

  // Tandem Stepped Glass Cockpit (Gunner in front, Pilot elevated behind)
  const canopyGeo = new THREE.BoxGeometry(1.4, 1.35, 3.0);
  canopyGeo.rotateX(-Math.PI / 9);
  const canopy = new THREE.Mesh(canopyGeo, materials.heliGlass);
  canopy.position.set(0, 0.7, 2.3);
  group.add(canopy);

  // Twin Turboshaft Engine Cowlings (Top Hump) with Dust Filter Intakes
  const engineGeo = new THREE.BoxGeometry(2.0, 1.05, 3.4);
  const engine = new THREE.Mesh(engineGeo, materials.darkSteel);
  engine.position.set(0, 1.3, -0.2);
  group.add(engine);

  // Upward Angled Heat-Suppressing Exhaust Nozzles
  const exhaustGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.6, 10);
  exhaustGeo.rotateZ(Math.PI / 4);
  for (let e = -1; e <= 1; e += 2) {
    const exh = new THREE.Mesh(exhaustGeo, materials.darkSteel);
    exh.position.set(e * 1.05, 1.45, -1.2);
    exh.rotation.x = -0.3;
    group.add(exh);
  }

  // Spheroid FLIR Target Acquisition and Laser Designator Ball on nose
  const flirGeo = new THREE.SphereGeometry(0.48, 14, 14);
  const flir = new THREE.Mesh(flirGeo, materials.darkSteel);
  flir.position.set(0, -0.4, 4.0);
  group.add(flir);

  const flirLens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), materials.heliGlass);
  flirLens.rotation.x = Math.PI / 2;
  flirLens.position.set(0, -0.4, 4.45);
  group.add(flirLens);

  // Chin 30mm Motorized Gatling Cannon Turret
  const chinGunTurretGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 8);
  const chinTurret = new THREE.Mesh(chinGunTurretGeo, materials.darkSteel);
  chinTurret.position.set(0, -0.9, 3.3);
  group.add(chinTurret);

  const chinGunGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.3, 8);
  chinGunGeo.rotateX(Math.PI / 2);
  const chinGun = new THREE.Mesh(chinGunGeo, materials.gunBarrel);
  chinGun.position.set(0, -1.0, 3.8);
  group.add(chinGun);

  // 2. Anhedral Weapons Stub Wings & Ordnance
  const wingGeo = new THREE.BoxGeometry(5.0, 0.2, 0.95);
  const wings = new THREE.Mesh(wingGeo, materials.heliFuselage);
  wings.position.set(0, 0.12, 0.4);
  group.add(wings);

  // Cylindrical 19-Tube Rocket Pods on Stub Wings
  const podGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.7, 14);
  podGeo.rotateX(Math.PI / 2);
  for (let s = -1; s <= 1; s += 2) {
    const pod = new THREE.Mesh(podGeo, materials.darkSteel);
    pod.position.set(s * 1.85, -0.22, 0.5);
    group.add(pod);

    // Exposed rocket nose cones inside pod
    for (let r = 0; r < 7; r++) {
      const angle = (r / 7) * Math.PI * 2;
      const rad = 0.24;
      const rocketTipGeo = new THREE.ConeGeometry(0.075, 0.22, 6);
      rocketTipGeo.rotateX(Math.PI / 2);
      const tip = new THREE.Mesh(rocketTipGeo, materials.lensRed);
      tip.position.set(s * 1.85 + Math.cos(angle) * rad, -0.22 + Math.sin(angle) * rad, 1.4);
      group.add(tip);
    }

    // Outer missile launch rails (Hellfire/Ataka style)
    const railGeo = new THREE.BoxGeometry(0.12, 0.12, 1.6);
    const rail = new THREE.Mesh(railGeo, materials.darkSteel);
    rail.position.set(s * 2.35, -0.15, 0.5);
    group.add(rail);

    const missileGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
    missileGeo.rotateX(Math.PI / 2);
    const missile = new THREE.Mesh(missileGeo, materials.tankGreen);
    missile.position.set(s * 2.35, -0.26, 0.5);
    group.add(missile);
  }

  // 3. Tail Boom & Stabilizers
  const tailBoomGeo = new THREE.CylinderGeometry(0.45, 0.85, 6.2, 12);
  tailBoomGeo.rotateX(Math.PI / 2);
  const tailBoom = new THREE.Mesh(tailBoomGeo, materials.heliFuselage);
  tailBoom.position.set(0, 0.42, -6.1);
  group.add(tailBoom);

  // Swept Vertical Fin
  const finGeo = new THREE.BoxGeometry(0.18, 2.2, 1.5);
  const fin = new THREE.Mesh(finGeo, materials.heliFuselage);
  fin.position.set(0, 1.25, -8.6);
  group.add(fin);

  // Horizontal Stabilizer Winglet
  const horizFinGeo = new THREE.BoxGeometry(2.4, 0.12, 0.8);
  const horizFin = new THREE.Mesh(horizFinGeo, materials.heliFuselage);
  horizFin.position.set(0, 0.9, -8.3);
  group.add(horizFin);

  // 4. Tail Anti-Torque Rotor
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.22, 1.7, -8.6);

  const trHubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.22, 8);
  trHubGeo.rotateZ(Math.PI / 2);
  const trHub = new THREE.Mesh(trHubGeo, materials.darkSteel);
  tailRotor.add(trHub);

  const trBladeGeo = new THREE.BoxGeometry(0.14, 2.0, 0.12);
  const trBlade = new THREE.Mesh(trBladeGeo, materials.rotorBlade);
  tailRotor.add(trBlade);
  group.add(tailRotor);

  // 5. Main Rotor Mast & 4 Curved Airfoil Blades
  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 2.05, 0);

  const mastGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 12);
  const mast = new THREE.Mesh(mastGeo, materials.darkSteel);
  mainRotor.add(mast);

  const swashplateGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.28, 12);
  const swashplate = new THREE.Mesh(swashplateGeo, materials.darkSteel);
  swashplate.position.y = 0.38;
  mainRotor.add(swashplate);

  const bladeGeo = new THREE.BoxGeometry(0.42, 0.05, 6.0);
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(bladeGeo, materials.rotorBlade);
    blade.position.set(0, 0.38, 3.0);

    // Yellow safety tip stripes on rotor blades
    const tipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.06, 0.5), materials.hazardSign);
    tipMesh.position.set(0, 0.38, 5.75);

    const bladePivot = new THREE.Group();
    bladePivot.rotation.y = (b * Math.PI) / 2;
    bladePivot.add(blade);
    bladePivot.add(tipMesh);
    mainRotor.add(bladePivot);
  }

  group.add(mainRotor);

  return { group, mainRotor, tailRotor };
}

/**
 * 5. 3D Airborne Paratrooper Model (High-Level Airborne Drops)
 * Features domed 16-gore parachute canopy with top air vent, suspension cables,
 * and a combat paratrooper hanging beneath with deployed chest pack and slung carbine.
 */
export function createParatrooperModel(): {
  group: THREE.Group;
  soldierGroup: THREE.Group;
  parachuteMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'paratrooper';
  group.scale.set(1.6, 1.6, 1.6);

  // Billowing Parachute Canopy (Hemisphere)
  const canopyGeo = new THREE.SphereGeometry(2.8, 18, 14, 0, Math.PI * 2, 0, Math.PI / 1.7);
  const parachuteMesh = new THREE.Mesh(canopyGeo, materials.parachute);
  parachuteMesh.position.set(0, 4.4, 0);
  group.add(parachuteMesh);

  // Air vent ring at the top apex of parachute
  const ventGeo = new THREE.TorusGeometry(0.38, 0.09, 8, 16);
  ventGeo.rotateX(Math.PI / 2);
  const vent = new THREE.Mesh(ventGeo, materials.darkSteel);
  vent.position.set(0, 4.4 + 2.75, 0);
  group.add(vent);

  // 12 Suspension Shroud Lines connecting canopy rim to soldier harness
  const cordsCount = 12;
  const linePositions: number[] = [];
  for (let c = 0; c < cordsCount; c++) {
    const ang = (c / cordsCount) * Math.PI * 2;
    const rimX = Math.cos(ang) * 2.7;
    const rimZ = Math.sin(ang) * 2.7;
    const rimY = 4.4 + 0.35;

    // Connects from rim to harness at (0, 1.85, 0)
    linePositions.push(rimX, rimY, rimZ);
    linePositions.push(0, 1.85, 0);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(lineGeo, materials.cables);
  group.add(lines);

  // Soldier model attached underneath with reserve chute pack on chest
  const { group: soldierGroup } = createSoldierModel();
  soldierGroup.position.set(0, 0, 0);

  // White reserve parachute pack on soldier's chest
  const reservePackGeo = new THREE.BoxGeometry(0.48, 0.32, 0.22);
  const reservePack = new THREE.Mesh(reservePackGeo, materials.parachute);
  reservePack.position.set(0, 1.05, 0.32);
  soldierGroup.add(reservePack);

  group.add(soldierGroup);

  return { group, soldierGroup, parachuteMesh };
}

/**
 * 360-Degree Moveable Gun Bunker Fortification & Pillbox Redoubt
 * Built directly around the player's turret.
 * Low-profile armored concrete parapet and sandbags that sit comfortably below the gunner's
 * sightline, providing 100% unobstructed panoramic 360-degree battlefield visibility.
 */
export function createBunkerRedoubt(): THREE.Group {
  const bunker = new THREE.Group();
  bunker.name = 'bunker_redoubt_emplacement';

  // 1. Diamond Steel Tread Floor Deck
  const floorGeo = new THREE.CylinderGeometry(4.4, 4.8, 0.4, 32);
  const floorMesh = new THREE.Mesh(floorGeo, materials.steelDeck);
  floorMesh.position.y = -0.2;
  floorMesh.receiveShadow = true;
  bunker.add(floorMesh);

  // Circular Turret Traverse Ring Gear on floor
  const gearRingGeo = new THREE.TorusGeometry(2.3, 0.1, 8, 32);
  gearRingGeo.rotateX(Math.PI / 2);
  const gearRing = new THREE.Mesh(gearRingGeo, materials.darkSteel);
  gearRing.position.y = 0.04;
  bunker.add(gearRing);

  // 2. Low-Profile Reinforced Concrete Parapet Wall (360 degrees)
  // Low parapet (height 0.48m, top at y = 0.48m) - well below gunner eye level
  const segments = 20;
  const wallRadius = 4.4;
  const blockWidth = (Math.PI * 2 * wallRadius) / segments;
  const blockGeo = new THREE.BoxGeometry(blockWidth * 0.96, 0.48, 0.4);

  for (let s = 0; s < segments; s++) {
    const angle = (s / segments) * Math.PI * 2;
    const wx = Math.cos(angle) * wallRadius;
    const wz = Math.sin(angle) * wallRadius;

    const block = new THREE.Mesh(blockGeo, materials.concrete);
    block.position.set(wx, 0.24, wz);
    block.rotation.y = -angle + Math.PI / 2;
    block.receiveShadow = true;
    bunker.add(block);

    // Armor steel rim plate on concrete top
    const rimPlateGeo = new THREE.BoxGeometry(blockWidth * 0.94, 0.05, 0.44);
    const rimPlate = new THREE.Mesh(rimPlateGeo, materials.darkSteel);
    rimPlate.position.set(wx, 0.48, wz);
    rimPlate.rotation.y = -angle + Math.PI / 2;
    bunker.add(rimPlate);
  }

  // 3. Low-Profile Sandbag Crest lining the parapet rim
  // Sandbags sit at y = 0.58m (top at 0.70m) - cleanly frames bottom of view
  const sandbagRadius = 4.4;
  const bagGeo = new THREE.BoxGeometry(0.85, 0.22, 0.45);
  for (let a = 0; a < Math.PI * 2; a += 0.22) {
    const bx = Math.cos(a) * sandbagRadius;
    const bz = Math.sin(a) * sandbagRadius;

    const bag = new THREE.Mesh(bagGeo, materials.sandbags);
    bag.position.set(bx, 0.58, bz);
    bag.rotation.y = a + Math.PI / 2;
    bunker.add(bag);
  }

  // 4. Low Reinforced Blast Hatch/Door at Rear (South / 180° azimuth)
  const doorFrameGeo = new THREE.BoxGeometry(1.5, 0.9, 0.25);
  const doorFrame = new THREE.Mesh(doorFrameGeo, materials.darkSteel);
  doorFrame.position.set(0, 0.45, 4.35);
  bunker.add(doorFrame);

  const doorLeafGeo = new THREE.BoxGeometry(1.2, 0.8, 0.12);
  const doorLeaf = new THREE.Mesh(doorLeafGeo, materials.armorSteel);
  doorLeaf.position.set(0, 0.45, 4.42);
  bunker.add(doorLeaf);

  // Door Pressure Handwheel Lock
  const handwheelGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16);
  const handwheel = new THREE.Mesh(handwheelGeo, materials.brass);
  handwheel.position.set(0, 0.45, 4.5);
  bunker.add(handwheel);

  // 5. Military Ammo Crates inside Bunker Redoubt (low on floor)
  const crateGeo = new THREE.BoxGeometry(0.75, 0.32, 0.45);
  const cratePositions = [
    { x: -2.8, y: 0.16, z: 2.2, rot: 0.3 },
    { x: -2.7, y: 0.48, z: 2.1, rot: 0.15 },
    { x: 2.8, y: 0.16, z: 2.2, rot: -0.4 },
    { x: 2.9, y: 0.16, z: 1.2, rot: 0.1 },
    { x: 2.85, y: 0.48, z: 1.7, rot: -0.2 },
  ];

  for (const cp of cratePositions) {
    const crate = new THREE.Mesh(crateGeo, materials.woodCrate);
    crate.position.set(cp.x, cp.y, cp.z);
    crate.rotation.y = cp.rot;
    bunker.add(crate);
  }

  // 6. Scattered Spent Brass Shell Casings on the bunker floor
  const casingGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6);
  casingGeo.rotateX(Math.PI / 2);
  for (let c = 0; c < 26; c++) {
    const casing = new THREE.Mesh(casingGeo, materials.brass);
    const cr = 1.0 + Math.random() * 2.2;
    const ca = Math.random() * Math.PI * 2;
    casing.position.set(Math.cos(ca) * cr, 0.03, Math.sin(ca) * cr);
    casing.rotation.y = Math.random() * Math.PI;
    bunker.add(casing);
  }

  // 7. Tactical Radio Comms Console on the Left Wall (lowered)
  const consoleGeo = new THREE.BoxGeometry(0.55, 0.5, 0.35);
  const radioConsole = new THREE.Mesh(consoleGeo, materials.darkSteel);
  radioConsole.position.set(-3.4, 0.28, 0.5);
  radioConsole.rotation.y = Math.PI / 2;
  bunker.add(radioConsole);

  // Status LED indicators
  const ledGeo = new THREE.SphereGeometry(0.03, 6, 6);
  const greenLed = new THREE.Mesh(ledGeo, materials.lensGreen);
  greenLed.position.set(-3.2, 0.45, 0.58);
  bunker.add(greenLed);

  const redLed = new THREE.Mesh(ledGeo, materials.lensRed);
  redLed.position.set(-3.2, 0.45, 0.42);
  bunker.add(redLed);

  return bunker;
}

/**
 * 6. Rugged Qandil Mountain Terrain (Rocky Gorge, Mountain Pass, Bunker Redoubt)
 * Authentic Middle Eastern mountain landscape: jagged limestone/granite crags,
 * steep canyon gorge where tanks advance, dusty paths, defensive sandbags, and 360 bunker.
 */
export function createMountainTerrain(): {
  terrainGroup: THREE.Group;
  getHeightAt: (x: number, z: number) => number;
} {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'qandil_mountains';

  // Ground plane resolution - expansive battlefield (higher res = smoother hills)
  const width = 460;
  const depth = 460;
  const segments = 230;
  const planeGeo = new THREE.PlaneGeometry(width, depth, segments, segments);
  planeGeo.rotateX(-Math.PI / 2);

  const posAttr = planeGeo.attributes.position;
  const count = posAttr.count;

  // Height function: elevated central hilltop redoubt + wide open combat plain + distant ridge
  const getHeightAt = (x: number, z: number): number => {
    const distFromCenter = Math.hypot(x, z);

    // 1. Hilltop redoubt plateau at center (radius 0 to 16m) at commanding height 6.0m
    if (distFromCenter < 16) {
      return 6.0;
    }

    // 2. Smooth defensive hill slope (radius 16m to 60m) sloping down from 6.0m to 0.0m
    if (distFromCenter < 60) {
      const t = (distFromCenter - 16) / 44;
      return 6.0 * 0.5 * (1 + Math.cos(t * Math.PI));
    }

    // 3. Wide open, gently undulating battlefield plain (radius 60m to 210m)
    // Very subtle undulations (±0.4m) so every enemy unit is in full, crystal-clear view
    let height = Math.sin(x * 0.02) * 0.35 + Math.cos(z * 0.025) * 0.35;

    // 4. Distant scenic mountain peaks on the far horizon (dist > 210m)
    if (distFromCenter > 210) {
      const rimFactor = (distFromCenter - 210) / 40;
      height += Math.min(24, Math.pow(rimFactor, 1.25) * 10);
      height += Math.sin(x * 0.06 + z * 0.04) * 3.5;
      height += Math.cos(x * 0.04 - z * 0.05) * 3.5;
    }

    return height;
  };

  // Color each vertex according to terrain type and roads for high visibility
  const colors: number[] = [];
  const colorGrass = new THREE.Color(0x618248);
  const colorGrassLight = new THREE.Color(0x739654);
  const colorRoad = new THREE.Color(0x82775c);
  const colorRock = new THREE.Color(COLORS.mountainRock);
  const colorPeak = new THREE.Color(COLORS.mountainRockDark);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getHeightAt(x, z);
    posAttr.setY(i, y);

    const dist = Math.hypot(x, z);
    const vColor = colorGrass.clone();

    // Subtle dirt road avenues leading out across the valley
    const roadNorth = Math.abs(x - Math.sin(z * 0.025) * 10);
    const roadEast = Math.abs(z - Math.sin(x * 0.025) * 10);

    // Estimate local relief by sampling neighbouring heights (slope shading)
    const slope = Math.abs(getHeightAt(x + 4, z) - getHeightAt(x - 4, z)) +
                  Math.abs(getHeightAt(x, z + 4) - getHeightAt(x, z - 4));

    if ((roadNorth < 8 && z < -20) || (roadEast < 8 && Math.abs(x) > 20)) {
      // Dusty road track
      vColor.lerp(colorRoad, 0.7);
    } else if (dist < 82) {
      // Hill & its lower fringe: packed dirt fading smoothly into the plain
      // (soft radial mask instead of a hard colored ring at the hill base).
      const hillMix = THREE.MathUtils.clamp((82 - dist) / 22, 0, 1);
      vColor.lerp(colorRoad, 0.55 * hillMix);
      vColor.lerp(colorRock, THREE.MathUtils.clamp(slope * 0.06, 0, 0.45) * hillMix);
      vColor.lerp(colorGrassLight, (1 - hillMix) * 0.25);
    } else if (y > 8) {
      // Distant rocky mountain foothills, slope-broken
      const rockMix = THREE.MathUtils.clamp((y - 8) / 14 + slope * 0.03, 0, 1);
      vColor.lerp(colorRock, rockMix * 0.8);
      if (y > 18) {
        vColor.lerp(colorPeak, 0.65);
      }
    } else {
      // Sunny combat plain with subtle variation + slope highlights
      const varMix = THREE.MathUtils.clamp((x + z) * 0.004 + 0.5 + slope * 0.05, 0, 0.5);
      vColor.lerp(colorGrassLight, varMix);
      vColor.lerp(colorRoad, THREE.MathUtils.clamp(slope * 0.02, 0, 0.3));
    }

    colors.push(vColor.r, vColor.g, vColor.b);
  }

  planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  planeGeo.computeVertexNormals();

  const groundTexture = createGroundTexture();
  const terrainMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    vertexColors: true,
    roughness: 0.86,
    metalness: 0.05,
    flatShading: false,
    bumpMap: groundTexture,
    bumpScale: 0.12,
  });

  const terrainMesh = new THREE.Mesh(planeGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainGroup.add(terrainMesh);

  // Add 360 Mountain Panorama Dome surrounding the world
  const panoramaDome = create360PanoramaDome();
  terrainGroup.add(panoramaDome);

  // Place Bunker Redoubt on the central hilltop (y = 6.0m)
  const bunkerRedoubt = createBunkerRedoubt();
  bunkerRedoubt.position.set(0, 6.0, 0);
  terrainGroup.add(bunkerRedoubt);

  // Scattered Qandil Boulders (displaced, higher-detail rocks; kept out of combat zone)
  const rockGeo = new THREE.IcosahedronGeometry(1, 2);
  // displace vertices for an irregular, faceted boulder silhouette
  const rockPos = rockGeo.attributes.position;
  for (let vi = 0; vi < rockPos.count; vi++) {
    const nx = rockPos.getX(vi);
    const ny = rockPos.getY(vi);
    const nz = rockPos.getZ(vi);
    const d = 1 + (Math.sin(nx * 5.3 + ny * 3.1) * 0.5 + Math.cos(nz * 4.7 + nx * 2.2) * 0.5) * 0.28;
    rockPos.setXYZ(vi, nx * d, ny * d, nz * d);
  }
  rockGeo.computeVertexNormals();
  // weathered rock texture (mottled grey-brown)
  const rockTexCanvas = document.createElement('canvas');
  rockTexCanvas.width = 256;
  rockTexCanvas.height = 256;
  {
    const rctx = rockTexCanvas.getContext('2d')!;
    rctx.fillStyle = '#5f594d';
    rctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      const shade = 80 + Math.random() * 60;
      rctx.fillStyle = `rgba(${shade},${shade - 6},${shade - 20},0.6)`;
      rctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 26; i++) {
      const px = Math.random() * 256;
      const py = Math.random() * 256;
      const pr = 12 + Math.random() * 40;
      const g = rctx.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, 'rgba(30,28,22,0.30)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      rctx.fillStyle = g;
      rctx.beginPath();
      rctx.arc(px, py, pr, 0, Math.PI * 2);
      rctx.fill();
    }
  }
  const rockTex = new THREE.CanvasTexture(rockTexCanvas);
  rockTex.anisotropy = 8;
  // Rocks live FAR from the battlefield so they never block sightlines to enemies.
  // They form a rocky band near the distant rim (160–340m).
  const rockCount = 70;
  for (let r = 0; r < rockCount; r++) {
    // Bias outward: ring from ~160m to ~340m
    const ang = Math.random() * Math.PI * 2;
    const rad = 165 + Math.pow(Math.random(), 1.3) * 175;
    const rx = Math.sin(ang) * rad;
    const rz = Math.cos(ang) * rad;
    const dist = Math.hypot(rx, rz);
    if (dist < 150) continue; // keep the whole combat zone clear of sight blockers

    const ry = getHeightAt(rx, rz);
    const rockMat = new THREE.MeshStandardMaterial({ map: rockTex, color: 0xffffff, roughness: 0.92, flatShading: true });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    const scale = 1.6 + Math.random() * 2.6;
    rockMesh.scale.set(scale * 1.1, scale * 0.7, scale * 0.9);
    rockMesh.position.set(rx, ry + scale * 0.35, rz);
    rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    terrainGroup.add(rockMesh);
  }

  // Scattered low shrubs on the plains
  const shrubGeo = new THREE.DodecahedronGeometry(0.7, 1);
  const shrubCount = 65;
  for (let s = 0; s < shrubCount; s++) {
    const sx = (Math.random() - 0.5) * 280;
    const sz = (Math.random() - 0.5) * 280;
    const dist = Math.hypot(sx, sz);
    if (dist < 72) continue;

    const sy = getHeightAt(sx, sz);
    const shrubMat = new THREE.MeshStandardMaterial({ color: 0x486435, roughness: 0.95 });
    const shrubMesh = new THREE.Mesh(shrubGeo, shrubMat);
    const scale = 0.8 + Math.random() * 1.2;
    shrubMesh.scale.set(scale, scale * 0.7, scale);
    shrubMesh.position.set(sx, sy + scale * 0.35, sz);
    terrainGroup.add(shrubMesh);
  }

  // Distant Communications Mast on far outpost ridge (not blocking local view)
  const commTower = new THREE.Group();
  const tx = -75;
  const tz = -65;
  const ty = getHeightAt(tx, tz);
  commTower.position.set(tx, ty, tz);

  const towerMastGeo = new THREE.CylinderGeometry(0.18, 0.35, 12.0, 8);
  const towerMast = new THREE.Mesh(towerMastGeo, materials.darkSteel);
  towerMast.position.y = 6.0;
  commTower.add(towerMast);

  const beaconGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 12.2;
  commTower.add(beacon);

  terrainGroup.add(commTower);

  return { terrainGroup, getHeightAt };
}
