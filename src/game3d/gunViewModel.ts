/**
 * High-Fidelity First-Person Gun Viewmodel.
 *
 * Replaces primitive block meshes with highly detailed, authentic firearm geometry
 * and procedural PBR materials (Parkerized gun steel, stamped military ammo cans,
 * 3D linked brass/copper cartridges, checkered diamond grips, and fluted barrels).
 *
 * Weapon Modes:
 *  - ZSU-23-4 / ZU-23 Anti-Air Autocannon: Twin screen-side mounts with fluted barrels,
 *    hydraulic recoil buffers, elevation sectors, 23mm feed chutes, and conical slotted brakes.
 *  - 105mm Heavy Artillery Cannon: Twin heavy cannons with stepped cylindrical breeches,
 *    overhead recoil cylinders, thermal canvas sleeves, and double-baffle muzzle brakes.
 *  - M60 GPMG: Full machine gun with textured receiver, hinged feed cover, stamped OD ammo can,
 *    articulated 3D linked 7.62mm brass ammunition belt, perforated heat shroud, carry handle,
 *    folded bipod, and checkered grip.
 *  - Hydra 70mm Quad Missile Pod: Octagonal composite launcher with yellow hazard stripes,
 *    four rifled launch tubes with visible rocket warheads, and optical FLIR targeting scope.
 *  - M1911-A1 Tactical .45 Handgun: Beveled slide with cocking serrations, ejection port,
 *    tritium green combat sights, checkered grip panels, hammer, and beavertail safety.
 */
import * as THREE from 'three';
import { WeaponType } from '../types';
import { getGunMaterials, GunMaterialSet } from './gunTextures';

interface MuzzleFlashUnit {
  group: THREE.Group;
  mats: THREE.MeshBasicMaterial[];
  light: THREE.PointLight;
  setColors: (core: number, plume: number, gas: number) => void;
  setScale: (scale: number) => void;
}

// Builds a realistic compact multi-layer muzzle flash
function createRealisticMuzzleFlash(
  scaleMultiplier: number = 1.0,
  lightColor: number = 0xfff8ea,
  lightDistance: number = 8
): MuzzleFlashUnit {
  const group = new THREE.Group();
  const mats: THREE.MeshBasicMaterial[] = [];

  // 1. Incandescent white-hot ignition core
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scaleMultiplier, 8, 8), coreMat);
  core.position.set(0, 0, -0.04 * scaleMultiplier);
  group.add(core);
  mats.push(coreMat);

  // 2. High-speed propellant plume exiting muzzle
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xfffef5, transparent: true, opacity: 0 });
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.065 * scaleMultiplier, 0.16 * scaleMultiplier, 8), plumeMat);
  plume.rotation.x = -Math.PI / 2;
  plume.position.set(0, 0, -0.09 * scaleMultiplier);
  group.add(plume);
  mats.push(plumeMat);

  // 3. Translucent expanding gas envelope
  const gasMat = new THREE.MeshBasicMaterial({ color: 0xf5f0e6, transparent: true, opacity: 0 });
  const gas = new THREE.Mesh(new THREE.SphereGeometry(0.075 * scaleMultiplier, 8, 8), gasMat);
  gas.scale.set(1.0, 1.0, 1.35);
  gas.position.set(0, 0, -0.08 * scaleMultiplier);
  group.add(gas);
  mats.push(gasMat);

  const light = new THREE.PointLight(lightColor, 0, lightDistance);

  const setColors = (cCore: number, cPlume: number, cGas: number) => {
    coreMat.color.setHex(cCore);
    plumeMat.color.setHex(cPlume);
    gasMat.color.setHex(cGas);
  };

  const setScale = (scale: number) => {
    group.scale.setScalar(scale);
  };

  return { group, mats, light, setColors, setScale };
}

// ============================================================================
// 1. BUILDER: Authentic Soviet ZSU-23-4 / ZU-23 Anti-Air Autocannon
// ============================================================================
function buildAAGunUnit(side: -1 | 1, gm: GunMaterialSet): {
  group: THREE.Group;
  barrelGroup: THREE.Group;
  flash: MuzzleFlashUnit;
} {
  const unit = new THREE.Group();
  unit.position.set(side * 0.72, -0.52, -0.85);
  unit.rotation.set(0.28, side * 0.14, 0);

  // Cradle Mount & Trunnion Housing
  const cradleGroup = new THREE.Group();

  // Chamfered steel receiver body
  const bodyGeo = new THREE.BoxGeometry(0.24, 0.20, 0.58);
  const body = new THREE.Mesh(bodyGeo, gm.gunSteel);
  body.position.set(0, -0.08, 0.14);
  cradleGroup.add(body);

  // Top receiver dust cover with reinforcement ribs
  const topCoverGeo = new THREE.BoxGeometry(0.18, 0.04, 0.46);
  const topCover = new THREE.Mesh(topCoverGeo, gm.darkNitride);
  topCover.position.set(0, 0.04, 0.12);
  cradleGroup.add(topCover);

  for (let r = -0.15; r <= 0.15; r += 0.08) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.015, 0.025), gm.gunSteel);
    rib.position.set(0, 0.065, 0.12 + r);
    cradleGroup.add(rib);
  }

  // Side trunnion elevation gear quadrant sector
  const gearSectorGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16, 1, false, 0, Math.PI);
  gearSectorGeo.rotateZ(Math.PI / 2);
  const gearSector = new THREE.Mesh(gearSectorGeo, gm.darkNitride);
  gearSector.position.set(side * -0.13, -0.08, 0.16);
  cradleGroup.add(gearSector);

  // Dual hydraulic buffer/recoil cylinders mounted above and below barrel
  const bufferGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.52, 10);
  bufferGeo.rotateX(Math.PI / 2);
  const bufferTop = new THREE.Mesh(bufferGeo, gm.gunSteel);
  bufferTop.position.set(0, 0.11, -0.12);
  const bufferBottom = new THREE.Mesh(bufferGeo, gm.gunSteel);
  bufferBottom.position.set(0, -0.14, -0.12);
  cradleGroup.add(bufferTop, bufferBottom);

  // Chrome piston rod shafts
  const pistonGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.26, 8);
  pistonGeo.rotateX(Math.PI / 2);
  const pistonT = new THREE.Mesh(pistonGeo, gm.brushedChrome);
  pistonT.position.set(0, 0.11, -0.42);
  const pistonB = new THREE.Mesh(pistonGeo, gm.brushedChrome);
  pistonB.position.set(0, -0.14, -0.42);
  cradleGroup.add(pistonT, pistonB);

  // Flexible steel 23mm linked ammunition feed chute on the outer flank
  const chuteGroup = new THREE.Group();
  for (let s = 0; s < 6; s++) {
    const linkSeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.06), gm.ammoLinkSteel);
    linkSeg.position.set(side * 0.16, -0.02 - s * 0.035, 0.18 - s * 0.04);
    linkSeg.rotation.z = side * (0.2 + s * 0.08);
    chuteGroup.add(linkSeg);

    // Visible 23mm brass casing inside chute
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.07, 8), gm.linkedAmmoBrass);
    shell.rotation.z = Math.PI / 2;
    shell.position.set(side * 0.16, -0.02 - s * 0.035, 0.18 - s * 0.04);
    chuteGroup.add(shell);
  }
  cradleGroup.add(chuteGroup);

  unit.add(cradleGroup);

  // --------------------------------------------------------------------------
  // Recoiling Barrel Assembly (Moves back on recoil)
  const barrelGroup = new THREE.Group();

  // Breech collar & gas block
  const breechCollarGeo = new THREE.CylinderGeometry(0.052, 0.056, 0.38, 14);
  breechCollarGeo.rotateX(Math.PI / 2);
  const breechCollar = new THREE.Mesh(breechCollarGeo, gm.gunSteel);
  breechCollar.position.set(0, 0, -0.19);
  barrelGroup.add(breechCollar);

  // Long fluted 23mm autocannon barrel (with longitudinal fluting for heat dissipation)
  const barrelLen = 1.45;
  const barrelGeo = new THREE.CylinderGeometry(0.038, 0.044, barrelLen, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, gm.gunSteel);
  barrel.position.set(0, 0, -0.38 - barrelLen / 2);
  barrelGroup.add(barrel);

  // Longitudinal cooling flutes along barrel length
  const fluteGeo = new THREE.CylinderGeometry(0.006, 0.006, barrelLen * 0.75, 6);
  fluteGeo.rotateX(Math.PI / 2);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const fx = Math.cos(ang) * 0.041;
    const fy = Math.sin(ang) * 0.041;
    const flute = new THREE.Mesh(fluteGeo, gm.darkNitride);
    flute.position.set(fx, fy, -0.38 - barrelLen * 0.45);
    barrelGroup.add(flute);
  }

  // Mid-barrel gas port collar
  const gasCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.08, 12), gm.darkNitride);
  gasCollar.geometry.rotateX(Math.PI / 2);
  gasCollar.position.set(0, 0, -1.05);
  barrelGroup.add(gasCollar);

  // Iconic Soviet Conical Slotted Muzzle Brake
  const brakeConeGeo = new THREE.CylinderGeometry(0.075, 0.045, 0.22, 14);
  brakeConeGeo.rotateX(Math.PI / 2);
  const brakeCone = new THREE.Mesh(brakeConeGeo, gm.darkNitride);
  brakeCone.position.set(0, 0, -1.94);
  barrelGroup.add(brakeCone);

  // Slotted gas exhaust baffles on the brake
  for (let s = 0; s < 4; s++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.02), gm.gunSteel);
    slot.position.set(0, 0, -1.86 - s * 0.045);
    barrelGroup.add(slot);
  }

  // Anti-Air Collimator Ring Sight (Illuminated optical ring on inner gunner side)
  const ringSightGroup = new THREE.Group();
  ringSightGroup.position.set(side * -0.10, 0.16, -0.35);
  const sightPost = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.09, 0.02), gm.gunSteel);
  ringSightGroup.add(sightPost);
  const sightRingGeo = new THREE.TorusGeometry(0.038, 0.005, 8, 16);
  const sightRing = new THREE.Mesh(sightRingGeo, gm.darkNitride);
  sightRing.position.y = 0.045;
  ringSightGroup.add(sightRing);
  const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), gm.sightGlowGreen);
  reticleDot.position.y = 0.045;
  ringSightGroup.add(reticleDot);
  barrelGroup.add(ringSightGroup);

  unit.add(barrelGroup);

  // Muzzle flash at the tip of the brake
  const flash = createRealisticMuzzleFlash(0.75, 0xeeffee, 8);
  flash.group.position.set(0, 0, -2.08);
  flash.light.position.set(0, 0, -2.08);
  unit.add(flash.group);
  unit.add(flash.light);

  return { group: unit, barrelGroup, flash };
}

// ============================================================================
// 2. BUILDER: Massive 105mm Heavy Artillery Cannon
// ============================================================================
function buildHeavyCannonUnit(side: -1 | 1, gm: GunMaterialSet): {
  group: THREE.Group;
  barrelGroup: THREE.Group;
  flash: MuzzleFlashUnit;
} {
  const unit = new THREE.Group();
  unit.position.set(side * 0.72, -0.52, -0.85);
  unit.rotation.set(0.28, side * 0.14, 0);

  // Heavy Artillery Breech Mount
  const breechGroup = new THREE.Group();

  // Stepped cylindrical breech ring
  const breechRingGeo = new THREE.CylinderGeometry(0.18, 0.20, 0.65, 16);
  breechRingGeo.rotateX(Math.PI / 2);
  const breechRing = new THREE.Mesh(breechRingGeo, gm.gunSteel);
  breechRing.position.set(0, -0.06, 0.15);
  breechGroup.add(breechRing);

  // Horizontal sliding wedge breech block
  const wedgeGeo = new THREE.BoxGeometry(0.16, 0.18, 0.28);
  const wedge = new THREE.Mesh(wedgeGeo, gm.darkNitride);
  wedge.position.set(side * 0.04, -0.06, 0.22);
  breechGroup.add(wedge);

  // Operating lever & latch
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.25, 8), gm.brushedChrome);
  lever.position.set(side * 0.14, 0.04, 0.22);
  lever.rotation.z = side * 0.6;
  breechGroup.add(lever);

  // Massive overhead hydropneumatic recoil recuperator cylinders
  const recuperatorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.78, 12);
  recuperatorGeo.rotateX(Math.PI / 2);
  const recL = new THREE.Mesh(recuperatorGeo, gm.darkNitride);
  recL.position.set(-0.075, 0.14, -0.08);
  const recR = new THREE.Mesh(recuperatorGeo, gm.darkNitride);
  recR.position.set(0.075, 0.14, -0.08);
  breechGroup.add(recL, recR);

  // Chrome piston rods entering recuperator
  const recPistonGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.35, 10);
  recPistonGeo.rotateX(Math.PI / 2);
  const pistonL = new THREE.Mesh(recPistonGeo, gm.brushedChrome);
  pistonL.position.set(-0.075, 0.14, -0.52);
  const pistonR = new THREE.Mesh(recPistonGeo, gm.brushedChrome);
  pistonR.position.set(0.075, 0.14, -0.52);
  breechGroup.add(pistonL, pistonR);

  unit.add(breechGroup);

  // --------------------------------------------------------------------------
  // Heavy Recoiling 105mm Barrel Assembly
  const barrelGroup = new THREE.Group();

  // Heavy stepped barrel
  const barrelLen = 1.70;
  const barrelGeo = new THREE.CylinderGeometry(0.075, 0.095, barrelLen, 16);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, gm.gunSteel);
  barrel.position.set(0, 0, -0.32 - barrelLen / 2);
  barrelGroup.add(barrel);

  // Thermal Canvas Protective Shroud Wrap (Middle section of barrel)
  const thermalGeo = new THREE.CylinderGeometry(0.092, 0.096, 0.72, 16);
  thermalGeo.rotateX(Math.PI / 2);
  const thermalShroud = new THREE.Mesh(thermalGeo, gm.thermalWrap);
  thermalShroud.position.set(0, 0, -0.92);
  barrelGroup.add(thermalShroud);

  // Clamping collars on thermal wrap
  for (let c = -0.32; c <= 0.32; c += 0.21) {
    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.097, 0.008, 8, 16), gm.darkNitride);
    clamp.position.set(0, 0, -0.92 + c);
    barrelGroup.add(clamp);
  }

  // Double-Baffle Tank / Artillery Muzzle Brake
  const brakeMainGeo = new THREE.BoxGeometry(0.24, 0.17, 0.32);
  const brakeMain = new THREE.Mesh(brakeMainGeo, gm.darkNitride);
  brakeMain.position.set(0, 0, -2.16);
  barrelGroup.add(brakeMain);

  // Side gas deflection vents (cutout baffles)
  for (let v = -0.06; v <= 0.06; v += 0.12) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.045), gm.gunSteel);
    vent.position.set(0, 0, -2.16 + v);
    barrelGroup.add(vent);
  }

  unit.add(barrelGroup);

  // Massive muzzle flash for 105mm high-explosive round
  const flash = createRealisticMuzzleFlash(1.65, 0xff7711, 14);
  flash.setColors(0xffffff, 0xffaa33, 0xff5500);
  flash.group.position.set(0, 0, -2.36);
  flash.light.position.set(0, 0, -2.36);
  unit.add(flash.group);
  unit.add(flash.light);

  return { group: unit, barrelGroup, flash };
}

// ============================================================================
// 3. BUILDER: Authentic M60 General Purpose Machine Gun (7.62x51mm NATO)
// ============================================================================
function buildM60Unit(gm: GunMaterialSet): {
  group: THREE.Group;
  flash: MuzzleFlashUnit;
} {
  const m60 = new THREE.Group();

  // 1. Lower Receiver Body with Beveled Contours & Lightening Cuts
  const lowerReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.58), gm.gunSteel);
  lowerReceiver.position.set(0, 0, 0);
  m60.add(lowerReceiver);

  // Side ejection port & brass deflector on the right
  const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.14), gm.darkNitride);
  ejectPort.position.set(0.068, 0.03, -0.02);
  const deflector = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.045, 0.06), gm.gunSteel);
  deflector.position.set(0.078, 0.04, 0.06);
  deflector.rotation.y = 0.4;
  m60.add(ejectPort, deflector);

  // 2. Ribbed Top Receiver Feed Cover with Stamped Creases & Latch
  const topCover = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.05, 0.44), gm.gunSteel);
  topCover.position.set(0, 0.095, -0.04);
  m60.add(topCover);

  for (let i = -0.16; i <= 0.16; i += 0.06) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.132, 0.012, 0.02), gm.darkNitride);
    rib.position.set(0, 0.122, -0.04 + i);
    m60.add(rib);
  }

  // Top cover latch release lever at rear
  const coverLatch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.05), gm.darkNitride);
  coverLatch.position.set(0, 0.11, 0.19);
  m60.add(coverLatch);

  // Cocking / Charging Handle on right side with knurled grip
  const cockingTrack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.38), gm.darkNitride);
  cockingTrack.position.set(0.07, -0.02, 0.02);
  const cockingKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 10), gm.checkeredGrip);
  cockingKnob.position.set(0.09, -0.02, 0.08);
  cockingKnob.rotation.z = Math.PI / 2;
  m60.add(cockingTrack, cockingKnob);

  // 3. Stamped Olive-Drab 100-Round Assault Ammo Can with Yellow Stenciling
  const ammoCan = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.22), gm.ammoCanOD);
  ammoCan.position.set(-0.145, -0.02, -0.04);
  m60.add(ammoCan);

  // Steel lid latch and wire handle on ammo can
  const canLatch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.04), gm.darkNitride);
  canLatch.position.set(-0.218, 0.03, -0.04);
  const canHandle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 12), gm.darkNitride);
  canHandle.position.set(-0.145, 0.08, -0.04);
  canHandle.rotation.x = Math.PI / 2;
  m60.add(canLatch, canHandle);

  // 4. Articulated 3D Linked 7.62mm Brass Ammunition Belt!
  // Replaces the generic flat box with real 3D cartridges!
  const beltGroup = new THREE.Group();
  const numRounds = 6;
  for (let r = 0; r < numRounds; r++) {
    const roundGroup = new THREE.Group();
    // Path curving out of ammo can into feed tray
    const frac = r / (numRounds - 1);
    const rx = -0.13 + frac * 0.08;
    const ry = 0.035 + Math.sin(frac * Math.PI) * 0.025;
    const rz = -0.06 + (Math.random() - 0.5) * 0.008;

    roundGroup.position.set(rx, ry, rz);
    roundGroup.rotation.z = (1 - frac) * 0.35;

    // Brass cartridge case (7.62x51mm NATO bottle-neck casing)
    const caseGeo = new THREE.CylinderGeometry(0.012, 0.013, 0.055, 10);
    caseGeo.rotateX(Math.PI / 2);
    const cartCase = new THREE.Mesh(caseGeo, gm.linkedAmmoBrass);
    roundGroup.add(cartCase);

    // Copper jacketed pointed spitzer bullet tip
    const bulletGeo = new THREE.ConeGeometry(0.009, 0.024, 10);
    bulletGeo.rotateX(-Math.PI / 2);
    const bullet = new THREE.Mesh(bulletGeo, gm.bulletCopper);
    bullet.position.set(0, 0, -0.038);
    roundGroup.add(bullet);

    // Blackened steel M13 disintegrating link clasp
    const linkGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.028, 8, 1, true, 0, Math.PI * 1.6);
    linkGeo.rotateX(Math.PI / 2);
    const link = new THREE.Mesh(linkGeo, gm.ammoLinkSteel);
    link.position.set(0, 0, 0.005);
    roundGroup.add(link);

    beltGroup.add(roundGroup);
  }
  m60.add(beltGroup);

  // 5. Perforated Barrel Heat Shroud with Authentic Vent Rings
  const shroudGroup = new THREE.Group();
  const shroudLen = 0.65;
  const shroudGeo = new THREE.CylinderGeometry(0.046, 0.046, shroudLen, 16, 1, true);
  shroudGeo.rotateX(Math.PI / 2);
  const shroudMesh = new THREE.Mesh(shroudGeo, gm.gunSteel);
  shroudMesh.position.set(0, 0.01, -0.62);
  shroudGroup.add(shroudMesh);

  // Perforated cooling rings and vent slots
  const ringGeo = new THREE.TorusGeometry(0.048, 0.005, 8, 16);
  for (let i = 0; i < 15; i++) {
    const ring = new THREE.Mesh(ringGeo, gm.darkNitride);
    ring.position.set(0, 0.01, -0.32 - i * 0.042);
    shroudGroup.add(ring);
  }
  m60.add(shroudGroup);

  // 6. Heavy 7.62mm Barrel extending through shroud
  const barrelLen = 1.18;
  const barrelGeo = new THREE.CylinderGeometry(0.026, 0.028, barrelLen, 14);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, gm.gunSteel);
  barrel.position.set(0, 0.01, -0.27 - barrelLen / 2);
  m60.add(barrel);

  // Gas cylinder tube under the barrel with regulator knob
  const gasTubeGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.68, 10);
  gasTubeGeo.rotateX(Math.PI / 2);
  const gasTube = new THREE.Mesh(gasTubeGeo, gm.darkNitride);
  gasTube.position.set(0, -0.034, -0.80);
  const gasRegulator = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 10), gm.gunSteel);
  gasRegulator.geometry.rotateX(Math.PI / 2);
  gasRegulator.position.set(0, -0.034, -1.13);
  m60.add(gasTube, gasRegulator);

  // 7. Folded Stamped Steel Bipod Legs pinned along gas tube
  const bipodHinge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), gm.darkNitride);
  bipodHinge.position.set(0, -0.034, -1.08);
  m60.add(bipodHinge);

  const bipodLegGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.44, 8);
  bipodLegGeo.rotateX(Math.PI / 2);
  const bipodL = new THREE.Mesh(bipodLegGeo, gm.darkNitride);
  bipodL.position.set(-0.038, -0.042, -0.92);
  const bipodR = new THREE.Mesh(bipodLegGeo, gm.darkNitride);
  bipodR.position.set(0.038, -0.042, -0.92);
  // Bipod feet (skis)
  const bipodFootL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), gm.gunSteel);
  bipodFootL.position.set(-0.038, -0.042, -1.14);
  const bipodFootR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), gm.gunSteel);
  bipodFootR.position.set(0.038, -0.042, -1.14);
  m60.add(bipodL, bipodR, bipodFootL, bipodFootR);

  // 8. Molded Carry Handle with Ergonomic Finger Grooves
  const handleGroup = new THREE.Group();
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 10), gm.checkeredGrip);
  handleBar.rotation.x = Math.PI / 2;
  handleBar.position.set(0.045, 0.165, -0.24);
  const handlePostF = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), gm.gunSteel);
  handlePostF.position.set(0.045, 0.125, -0.16);
  const handlePostR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), gm.gunSteel);
  handlePostR.position.set(0.045, 0.125, -0.32);
  handleGroup.add(handleBar, handlePostF, handlePostR);
  m60.add(handleGroup);

  // 9. Front & Rear Combat Iron Sights
  // Front sight post with protective sight ears
  const frontSightGroup = new THREE.Group();
  frontSightGroup.position.set(0, 0.056, -1.38);
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.045, 0.035), gm.gunSteel);
  earL.position.set(-0.018, 0, 0);
  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.045, 0.035), gm.gunSteel);
  earR.position.set(0.018, 0, 0);
  const postBlade = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.035, 0.012), gm.darkNitride);
  postBlade.position.set(0, -0.005, 0);
  frontSightGroup.add(earL, earR, postBlade);
  m60.add(frontSightGroup);

  // Rear flip-up sight leaf
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.015), gm.darkNitride);
  rearSight.position.set(0, 0.145, 0.14);
  m60.add(rearSight);

  // 10. Slotted Birdcage Flash Suppressor
  const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.13, 12), gm.darkNitride);
  brake.geometry.rotateX(Math.PI / 2);
  brake.position.set(0, 0.01, -1.45);
  m60.add(brake);

  // 11. Ergonomic Pistol Grip & Trigger Guard
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.12, 0.075), gm.checkeredGrip);
  grip.position.set(0, -0.12, 0.12);
  grip.rotation.x = 0.28;
  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 12, Math.PI), gm.gunSteel);
  triggerGuard.position.set(0, -0.085, 0.05);
  triggerGuard.rotation.y = Math.PI / 2;
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.035, 0.015), gm.brushedChrome);
  trigger.position.set(0, -0.078, 0.05);
  trigger.rotation.x = 0.3;
  m60.add(grip, triggerGuard, trigger);

  // Realistic pale white-hot muzzle flash
  const flash = createRealisticMuzzleFlash(0.65, 0xfff4dc, 8);
  flash.setColors(0xffffff, 0xfff8ea, 0xf5ebe0);
  flash.group.position.set(0, 0.01, -1.54);
  flash.light.position.set(0, 0.01, -1.54);
  m60.add(flash.group);
  m60.add(flash.light);

  return { group: m60, flash };
}

// ============================================================================
// 4. BUILDER: Hydra 70mm Quad Tactical Rocket Pod
// ============================================================================
function buildRocketPodUnit(gm: GunMaterialSet): {
  group: THREE.Group;
  flash: MuzzleFlashUnit;
} {
  const pod = new THREE.Group();

  // Heavy Octagonal Launcher Container with Composite Armor & Yellow Hazard Band
  const podBodyGeo = new THREE.BoxGeometry(0.26, 0.24, 0.68);
  const podBody = new THREE.Mesh(podBodyGeo, gm.missileComposite);
  podBody.position.set(0, 0.05, -0.48);
  pod.add(podBody);

  // Structural aluminum reinforcement perimeter collars
  for (let c = -0.24; c <= 0.24; c += 0.24) {
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.275, 0.255, 0.035), gm.darkNitride);
    collar.position.set(0, 0.05, -0.48 + c);
    pod.add(collar);
  }

  // Front Exhaust Blast Shield Faceplate
  const faceplateGeo = new THREE.BoxGeometry(0.27, 0.25, 0.03);
  const faceplate = new THREE.Mesh(faceplateGeo, gm.gunSteel);
  faceplate.position.set(0, 0.05, -0.83);
  pod.add(faceplate);

  // 4 Stepped Launch Tube Cells with Beveled Aluminum Rims & Visible Rockets
  const tubeGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.12, 14, 1, true);
  tubeGeo.rotateX(Math.PI / 2);
  const rocketGeo = new THREE.ConeGeometry(0.035, 0.14, 12);
  rocketGeo.rotateX(-Math.PI / 2);
  const fuseGeo = new THREE.SphereGeometry(0.009, 6, 6);

  const offsets = [
    { x: -0.065, y: 0.105 },
    { x: 0.065, y: 0.105 },
    { x: -0.065, y: -0.005 },
    { x: 0.065, y: -0.005 },
  ];

  offsets.forEach((off) => {
    // Launch tube muzzle collar
    const tube = new THREE.Mesh(tubeGeo, gm.darkNitride);
    tube.position.set(off.x, off.y, -0.87);
    pod.add(tube);

    // Visible rocket warhead tip inside tube!
    const warhead = new THREE.Mesh(rocketGeo, gm.gunSteel);
    warhead.position.set(off.x, off.y, -0.85);
    pod.add(warhead);

    // Impact contact fuse tip
    const fuse = new THREE.Mesh(fuseGeo, gm.brushedChrome);
    fuse.position.set(off.x, off.y, -0.92);
    pod.add(fuse);
  });

  // Side-Mounted Optical FLIR / Target Acquisition Sight Unit
  const sightBoxGeo = new THREE.BoxGeometry(0.07, 0.09, 0.18);
  const sightBox = new THREE.Mesh(sightBoxGeo, gm.darkNitride);
  sightBox.position.set(0.165, 0.12, -0.42);
  pod.add(sightBox);

  // Anti-reflective emerald-tinted optical lens
  const lensGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.02, 14);
  lensGeo.rotateX(Math.PI / 2);
  const lens = new THREE.Mesh(lensGeo, gm.opticGlass);
  lens.position.set(0.165, 0.12, -0.52);
  pod.add(lens);

  // Shock-resistant cable conduit
  const cableGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.32, 6);
  cableGeo.rotateX(Math.PI / 2);
  const cable = new THREE.Mesh(cableGeo, gm.darkNitride);
  cable.position.set(0.145, 0.04, -0.35);
  pod.add(cable);

  // Fiery rocket launch ignition flash
  const flash = createRealisticMuzzleFlash(1.1, 0xff9922, 10);
  flash.setColors(0xffffff, 0xffa522, 0xff6600);
  flash.group.position.set(0, 0.05, -0.95);
  flash.light.position.set(0, 0.05, -0.95);
  pod.add(flash.group);
  pod.add(flash.light);

  return { group: pod, flash };
}

// ============================================================================
// 5. BUILDER: M1911-A1 Tactical .45 Semi-Automatic Handgun
// ============================================================================
function buildHandgunUnit(gm: GunMaterialSet): {
  group: THREE.Group;
  flash: MuzzleFlashUnit;
} {
  const handgun = new THREE.Group();

  // 1. Steel Slide with Radiused Top & Front Chamfer
  const slideGeo = new THREE.BoxGeometry(0.052, 0.054, 0.24);
  const slide = new THREE.Mesh(slideGeo, gm.gunSteel);
  slide.position.set(0, 0.03, -0.35);
  handgun.add(slide);

  // Precision Rear Cocking Serrations (vertical traction grooves)
  for (let s = 0; s < 7; s++) {
    const serrL = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.038, 0.006), gm.darkNitride);
    serrL.position.set(-0.027, 0.03, -0.26 - s * 0.012);
    const serrR = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.038, 0.006), gm.darkNitride);
    serrR.position.set(0.027, 0.03, -0.26 - s * 0.012);
    handgun.add(serrL, serrR);
  }

  // Cutout Ejection Port & Exposed Stainless Chamber Face
  const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.028, 0.065), gm.darkNitride);
  ejectPort.position.set(0.022, 0.042, -0.36);
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 10), gm.brushedChrome);
  chamber.geometry.rotateX(Math.PI / 2);
  chamber.position.set(0.01, 0.035, -0.36);
  handgun.add(ejectPort, chamber);

  // 2. 3-Dot Tactical Combat Iron Sights with Luminescent Tritium Green Dots
  // Front sight blade + green dot
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.018, 0.015), gm.darkNitride);
  frontSight.position.set(0, 0.066, -0.455);
  const frontDot = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 6, 6), gm.sightGlowGreen);
  frontDot.position.set(0, 0.066, -0.45);
  handgun.add(frontSight, frontDot);

  // Rear sight notch + dual green dots
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.015), gm.darkNitride);
  rearSight.position.set(0, 0.066, -0.24);
  const rearDotL = new THREE.Mesh(new THREE.SphereGeometry(0.003, 6, 6), gm.sightGlowGreen);
  rearDotL.position.set(-0.012, 0.066, -0.235);
  const rearDotR = new THREE.Mesh(new THREE.SphereGeometry(0.003, 6, 6), gm.sightGlowGreen);
  rearDotR.position.set(0.012, 0.066, -0.235);
  handgun.add(rearSight, rearDotL, rearDotR);

  // 3. Stainless Steel Match-Grade Barrel & Recoil Spring Plug
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.016, 0.12, 10), gm.brushedChrome);
  barrel.geometry.rotateX(Math.PI / 2);
  barrel.position.set(0, 0.03, -0.48);
  const springPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.04, 8), gm.darkNitride);
  springPlug.geometry.rotateX(Math.PI / 2);
  springPlug.position.set(0, 0.008, -0.465);
  handgun.add(barrel, springPlug);

  // 4. Steel Frame with Beveled Trigger Guard & Curved Trigger
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.065, 0.18), gm.gunSteel);
  frame.position.set(0, 0.005, -0.24);
  frame.rotation.x = -0.12;
  handgun.add(frame);

  const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 12, Math.PI), gm.gunSteel);
  triggerGuard.position.set(0, -0.015, -0.30);
  triggerGuard.rotation.y = Math.PI / 2;
  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.024, 0.012), gm.brushedChrome);
  trigger.position.set(0, -0.01, -0.30);
  trigger.rotation.x = 0.25;
  handgun.add(triggerGuard, trigger);

  // 5. Ergonomic Checkered Grip Panels with Diamond Knurling & Grip Screws
  const gripFrame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.11, 0.065), gm.gunSteel);
  gripFrame.position.set(0, -0.065, -0.205);
  gripFrame.rotation.x = 0.26;
  handgun.add(gripFrame);

  // Left & Right Checkered Grip Panels
  const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.095, 0.055), gm.checkeredGrip);
  panelL.position.set(-0.024, -0.065, -0.205);
  panelL.rotation.x = 0.26;
  const panelR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.095, 0.055), gm.checkeredGrip);
  panelR.position.set(0.024, -0.065, -0.205);
  panelR.rotation.x = 0.26;
  handgun.add(panelL, panelR);

  // Brass grip medallion & screws
  const screwGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.005, 6);
  screwGeo.rotateZ(Math.PI / 2);
  const screw1 = new THREE.Mesh(screwGeo, gm.linkedAmmoBrass);
  screw1.position.set(0.028, -0.035, -0.215);
  const screw2 = new THREE.Mesh(screwGeo, gm.linkedAmmoBrass);
  screw2.position.set(0.028, -0.095, -0.198);
  handgun.add(screw1, screw2);

  // 6. Combat Hammer, Extended Beavertail Safety & Slide Stop
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.03, 0.022), gm.darkNitride);
  hammer.position.set(0, 0.042, -0.21);
  hammer.rotation.x = 0.45;
  const beavertail = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.015, 0.04), gm.gunSteel);
  beavertail.position.set(0, 0.015, -0.185);
  beavertail.rotation.x = 0.35;
  const slideStop = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.028), gm.darkNitride);
  slideStop.position.set(-0.026, 0.022, -0.32);
  handgun.add(hammer, beavertail, slideStop);

  // Magazine basepad bumper
  const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.015, 0.07), gm.darkNitride);
  magBase.position.set(0, -0.12, -0.19);
  magBase.rotation.x = 0.26;
  handgun.add(magBase);

  // Snappy .45 ACP muzzle flash
  const flash = createRealisticMuzzleFlash(0.42, 0xfffaeb, 6);
  flash.setColors(0xffffff, 0xfff9ec, 0xf2ebe2);
  flash.group.position.set(0, 0.03, -0.54);
  flash.light.position.set(0, 0.03, -0.54);
  handgun.add(flash.group);
  handgun.add(flash.light);

  return { group: handgun, flash };
}

// ============================================================================
// MAIN VIEWMODEL CLASS
// ============================================================================
export class GunViewModel {
  public group: THREE.Group;

  // Twin Mounts (AA Gun & Heavy Cannon)
  private twin = new THREE.Group();
  private twinAA_Left!: ReturnType<typeof buildAAGunUnit>;
  private twinAA_Right!: ReturnType<typeof buildAAGunUnit>;
  private twinCannon_Left!: ReturnType<typeof buildHeavyCannonUnit>;
  private twinCannon_Right!: ReturnType<typeof buildHeavyCannonUnit>;

  // Single Weapons (Held bottom-right)
  private single = new THREE.Group();
  private m60Unit!: ReturnType<typeof buildM60Unit>;
  private missileUnit!: ReturnType<typeof buildRocketPodUnit>;
  private handgunUnit!: ReturnType<typeof buildHandgunUnit>;

  // Active state
  private weaponType: WeaponType = 'm60';
  private currentRecoil: number = 0;
  private targetRecoil: number = 0;
  private muzzleFlashTimer: number = 0;
  private idleTime: number = 0;
  private lastSide: number = -1;

  // Spent cartridge casings
  private casings: { mesh: THREE.Mesh; velocity: THREE.Vector3; rotSpeed: THREE.Vector3; life: number }[] = [];
  private casingGeo: THREE.CylinderGeometry;
  private casingMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'gun_viewmodel';

    const gm = getGunMaterials();

    // 1. Build Twin AA Autocannons
    this.twinAA_Left = buildAAGunUnit(-1, gm);
    this.twinAA_Right = buildAAGunUnit(1, gm);
    this.twin.add(this.twinAA_Left.group, this.twinAA_Right.group);

    // 2. Build Twin 105mm Heavy Artillery Cannons
    this.twinCannon_Left = buildHeavyCannonUnit(-1, gm);
    this.twinCannon_Right = buildHeavyCannonUnit(1, gm);
    this.twin.add(this.twinCannon_Left.group, this.twinCannon_Right.group);

    this.twin.scale.setScalar(0.85);
    this.group.add(this.twin);

    // 3. Build Single Held Weapons (M60, Missile Pod, Handgun)
    this.single.position.set(0.28, -0.30, -0.6);
    this.single.rotation.set(0.03, -0.1, -0.02);

    this.m60Unit = buildM60Unit(gm);
    this.single.add(this.m60Unit.group);

    this.missileUnit = buildRocketPodUnit(gm);
    this.single.add(this.missileUnit.group);

    this.handgunUnit = buildHandgunUnit(gm);
    this.single.add(this.handgunUnit.group);

    this.group.add(this.single);

    // Cartridge geometry
    this.casingGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 8);
    this.casingMat = gm.linkedAmmoBrass;

    this.setWeapon('m60');
  }

  public setWeapon(type: WeaponType) {
    this.weaponType = type;

    const isAAGun = type === 'aa_gun';
    const isHeavy = type === 'heavy_cannon';
    const isM60 = type === 'm60';
    const isMissile = type === 'missile';
    const isHandgun = type === 'handgun';

    // Twin mounts visibility
    this.twin.visible = isAAGun || isHeavy;
    this.twinAA_Left.group.visible = isAAGun;
    this.twinAA_Right.group.visible = isAAGun;
    this.twinCannon_Left.group.visible = isHeavy;
    this.twinCannon_Right.group.visible = isHeavy;

    // Single weapon visibility
    this.single.visible = isM60 || isMissile || isHandgun;
    this.m60Unit.group.visible = isM60;
    this.missileUnit.group.visible = isMissile;
    this.handgunUnit.group.visible = isHandgun;
  }

  public triggerRecoil(intensity: number = 1.0, side: number = -1) {
    this.targetRecoil = Math.min(1.4, this.targetRecoil + 0.5 * intensity);
    this.lastSide = side === 0 ? -1 : side;

    if (this.weaponType === 'handgun') {
      this.muzzleFlashTimer = 0.035;
      this.handgunUnit.flash.mats.forEach((m) => { m.opacity = 1.0; });
      this.handgunUnit.flash.light.intensity = 2.2 * intensity;
    } else if (this.weaponType === 'aa_gun') {
      this.muzzleFlashTimer = 0.04;
      const flip = (flash: MuzzleFlashUnit, on: boolean) => {
        flash.mats.forEach((m) => { m.opacity = on ? 1.0 : 0; });
        flash.light.intensity = on ? 3.2 * intensity : 0;
      };
      flip(this.twinAA_Left.flash, this.lastSide < 0);
      flip(this.twinAA_Right.flash, this.lastSide > 0);
    } else if (this.weaponType === 'heavy_cannon') {
      this.muzzleFlashTimer = 0.085;
      const flip = (flash: MuzzleFlashUnit, on: boolean) => {
        flash.mats.forEach((m) => { m.opacity = on ? 1.0 : 0; });
        flash.light.intensity = on ? 6.5 * intensity : 0;
      };
      flip(this.twinCannon_Left.flash, this.lastSide < 0);
      flip(this.twinCannon_Right.flash, this.lastSide > 0);
    } else if (this.weaponType === 'missile') {
      this.muzzleFlashTimer = 0.065;
      this.missileUnit.flash.mats.forEach((m) => { m.opacity = 1.0; });
      this.missileUnit.flash.light.intensity = 4.2 * intensity;
    } else {
      // m60
      this.muzzleFlashTimer = 0.04;
      this.m60Unit.flash.mats.forEach((m) => { m.opacity = 1.0; });
      this.m60Unit.flash.light.intensity = 2.8 * intensity;
    }

    this.ejectCasing();
  }

  private ejectCasing() {
    const mesh = new THREE.Mesh(this.casingGeo, this.casingMat);
    const isTwin = this.weaponType === 'aa_gun' || this.weaponType === 'heavy_cannon';
    mesh.position.set(isTwin ? this.lastSide * 0.12 : 0.08, -0.05, 0.1);
    this.group.add(mesh);
    this.casings.push({
      mesh,
      velocity: new THREE.Vector3(
        (isTwin ? this.lastSide : 1) * (0.8 + Math.random() * 0.6),
        0.9 + Math.random() * 0.5,
        0.3
      ),
      rotSpeed: new THREE.Vector3(Math.random() * 15, Math.random() * 15, Math.random() * 15),
      life: 0,
    });
  }

  public update(dt: number) {
    this.idleTime += dt;

    this.currentRecoil = THREE.MathUtils.lerp(this.currentRecoil, this.targetRecoil, dt * 28);
    this.targetRecoil = Math.max(0, this.targetRecoil - dt * 6.5);

    const swayX = Math.sin(this.idleTime * 1.5) * 0.004;
    const swayY = Math.cos(this.idleTime * 3.0) * 0.004;
    const kick = this.currentRecoil * 0.12;

    // Twin mounts: Dynamic mechanical recoil kick for barrel group & mounts
    if (this.weaponType === 'aa_gun') {
      this.twinAA_Left.group.position.set(-0.72 + swayX * 0.5, -0.52 + swayY, -0.85 + (this.lastSide < 0 ? kick * 0.6 : 0));
      this.twinAA_Right.group.position.set(0.72 - swayX * 0.5, -0.52 + swayY, -0.85 + (this.lastSide > 0 ? kick * 0.6 : 0));
      this.twinAA_Left.barrelGroup.position.z = this.lastSide < 0 ? kick * 1.4 : 0;
      this.twinAA_Right.barrelGroup.position.z = this.lastSide > 0 ? kick * 1.4 : 0;
    } else if (this.weaponType === 'heavy_cannon') {
      this.twinCannon_Left.group.position.set(-0.72 + swayX * 0.5, -0.52 + swayY, -0.85 + (this.lastSide < 0 ? kick * 0.8 : 0));
      this.twinCannon_Right.group.position.set(0.72 - swayX * 0.5, -0.52 + swayY, -0.85 + (this.lastSide > 0 ? kick * 0.8 : 0));
      this.twinCannon_Left.barrelGroup.position.z = this.lastSide < 0 ? kick * 2.0 : 0;
      this.twinCannon_Right.barrelGroup.position.z = this.lastSide > 0 ? kick * 2.0 : 0;
    }

    // Single weapon sway and recoil kick
    this.single.position.set(0.28 + swayX, -0.30 + swayY + kick * 0.02, -0.6 + kick * 0.9);
    this.single.rotation.set(0.03 - kick * 0.12, -0.1, -0.02 + kick * 0.03);

    // Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        // Clear all flashes and lights
        this.twinAA_Left.flash.mats.forEach((m) => { m.opacity = 0; });
        this.twinAA_Right.flash.mats.forEach((m) => { m.opacity = 0; });
        this.twinAA_Left.flash.light.intensity = 0;
        this.twinAA_Right.flash.light.intensity = 0;

        this.twinCannon_Left.flash.mats.forEach((m) => { m.opacity = 0; });
        this.twinCannon_Right.flash.mats.forEach((m) => { m.opacity = 0; });
        this.twinCannon_Left.flash.light.intensity = 0;
        this.twinCannon_Right.flash.light.intensity = 0;

        this.m60Unit.flash.mats.forEach((m) => { m.opacity = 0; });
        this.m60Unit.flash.light.intensity = 0;

        this.missileUnit.flash.mats.forEach((m) => { m.opacity = 0; });
        this.missileUnit.flash.light.intensity = 0;

        this.handgunUnit.flash.mats.forEach((m) => { m.opacity = 0; });
        this.handgunUnit.flash.light.intensity = 0;
      }
    }

    // Ejected casings physics update
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life += dt;
      c.velocity.y -= 9.8 * dt;
      c.mesh.position.addScaledVector(c.velocity, dt);
      c.mesh.rotation.x += c.rotSpeed.x * dt;
      c.mesh.rotation.y += c.rotSpeed.y * dt;
      if (c.life > 0.65 || c.mesh.position.y < -1.5) {
        this.group.remove(c.mesh);
        this.casings.splice(i, 1);
      }
    }
  }
}
