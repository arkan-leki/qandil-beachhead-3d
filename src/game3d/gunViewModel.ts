/**
 * First-Person Gun Viewmodel.
 *
 * Two modes:
 *  - TWO screen-side turret barrels (AA / cannon) — one rising from bottom-left,
 *    one from bottom-right, angling toward the horizon, firing alternately.
 *  - ONE-HANDED weapon (M60 / rocket / handgun) — a single gun held at the
 *    bottom-right of the view, like a normal FPS.
 */
import * as THREE from 'three';
import { WeaponType } from '../types';

interface UnitRefs {
  group: THREE.Group;
  base: THREE.Mesh;
  barrel: THREE.Mesh;
  flash: THREE.Mesh;
  light: THREE.PointLight;
  pod: THREE.Group;
}

export class GunViewModel {
  public group: THREE.Group;

  // Twin screen-side guns (AA + cannon)
  private twin = new THREE.Group();
  private left = {} as UnitRefs;
  private right = {} as UnitRefs;
  private leftBarrelLen = 1.5;
  private rightBarrelLen = 1.5;

  // One-handed weapon (M60 / rocket / handgun)
  private single = new THREE.Group();
  private singleM60 = new THREE.Group();
  private singlePod = new THREE.Group();
  private handgun = new THREE.Group();
  private singleFlash = new THREE.Mesh();
  private singleLight = new THREE.PointLight();

  // Recoil & animation
  private currentRecoil: number = 0;
  private targetRecoil: number = 0;
  private muzzleFlashTimer: number = 0;
  private idleTime: number = 0;
  private lastSide: number = -1;
  private weaponType: WeaponType = 'm60';

  private casings: { mesh: THREE.Mesh; velocity: THREE.Vector3; rotSpeed: THREE.Vector3; life: number }[] = [];
  private casingGeo: THREE.CylinderGeometry;
  private casingMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'gun_viewmodel';

    const gunSteelMat = new THREE.MeshStandardMaterial({ color: 0x1f2326, roughness: 0.35, metalness: 0.85 });
    const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x121415, roughness: 0.5, metalness: 0.9 });
    const highlightMat = new THREE.MeshStandardMaterial({ color: 0x3d4347, roughness: 0.25, metalness: 0.7 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc8a652, roughness: 0.3, metalness: 0.9 });

    // ============ TWIN SCREEN-SIDE GUNS ============
    const buildUnit = (side: -1 | 1): UnitRefs => {
      const refs = {} as UnitRefs;
      refs.group = new THREE.Group();
      // Keep the units mostly offscreen so they don't cover the view;
      // only the barrel tips angle toward the centre.
      refs.group.position.set(side * 0.72, -0.52, -0.85);
      refs.group.rotation.set(0.28, side * 0.14, 0);

      const baseGeo = new THREE.BoxGeometry(0.22, 0.22, 0.5);
      refs.base = new THREE.Mesh(baseGeo, gunSteelMat);
      refs.base.position.set(0, -0.1, 0.18);
      refs.group.add(refs.base);

      const barrelGeo = new THREE.CylinderGeometry(0.045, 0.05, 1.5, 14);
      barrelGeo.rotateX(Math.PI / 2);
      refs.barrel = new THREE.Mesh(barrelGeo, gunSteelMat);
      refs.barrel.position.set(0, 0.03, -0.75);
      refs.group.add(refs.barrel);

      const brakeGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.2, 14);
      brakeGeo.rotateX(Math.PI / 2);
      const brake = new THREE.Mesh(brakeGeo, darkTrimMat);
      brake.position.set(0, 0.03, -1.48);
      refs.group.add(brake);

      const railGeo = new THREE.BoxGeometry(0.09, 0.04, 0.55);
      const rail = new THREE.Mesh(railGeo, highlightMat);
      rail.position.set(0, 0.12, -0.5);
      refs.group.add(rail);

      const flashMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 });
      refs.flash = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), flashMat);
      refs.flash.position.set(0, 0.03, -1.6);
      refs.group.add(refs.flash);

      refs.light = new THREE.PointLight(0xffaa33, 0, 8);
      refs.light.position.set(0, 0.03, -1.6);
      refs.group.add(refs.light);

      refs.pod = new THREE.Group();
      const podBoxGeo = new THREE.BoxGeometry(0.2, 0.2, 0.55);
      const podBox = new THREE.Mesh(podBoxGeo, darkTrimMat);
      podBox.position.set(0, 0.04, -0.4);
      refs.pod.add(podBox);
      refs.pod.visible = false;
      refs.group.add(refs.pod);

      this.twin.add(refs.group);
      return refs;
    };

    this.left = buildUnit(-1);
    this.right = buildUnit(1);
    // tiny extra scale keeps them from filling the screen
    this.twin.scale.setScalar(0.85);
    this.group.add(this.twin);

    // ============ ONE-HANDED WEAPON ============
    this.single.position.set(0.28, -0.30, -0.6); // held bottom-right
    this.single.rotation.set(0.03, -0.1, -0.02);

    // M60 General Purpose Machine Gun Assembly
    this.singleM60 = new THREE.Group();

    // Receiver block
    const sBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.55), gunSteelMat);
    sBase.position.set(0, 0, 0);
    this.singleM60.add(sBase);

    // Top receiver feed cover
    const sTop = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.42), highlightMat);
    sTop.position.set(0, 0.09, -0.04);
    this.singleM60.add(sTop);

    // 100-round Olive Drab assault ammo box mounted to left of receiver
    const odGreenMat = new THREE.MeshStandardMaterial({ color: 0x3b4736, roughness: 0.55, metalness: 0.25 });
    const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.20), odGreenMat);
    ammoBox.position.set(-0.13, -0.02, -0.04);
    this.singleM60.add(ammoBox);

    // Visible brass linked 7.62mm ammunition entering the feed tray
    const ammoBeltGeo = new THREE.BoxGeometry(0.06, 0.035, 0.09);
    const ammoBelt = new THREE.Mesh(ammoBeltGeo, brassMat);
    ammoBelt.position.set(-0.07, 0.045, -0.04);
    this.singleM60.add(ammoBelt);

    // Barrel
    const sBarrelGeo = new THREE.CylinderGeometry(0.026, 0.028, 1.15, 12);
    sBarrelGeo.rotateX(Math.PI / 2);
    const m60Barrel = new THREE.Mesh(sBarrelGeo, gunSteelMat);
    m60Barrel.position.set(0, 0.01, -0.27 - 0.575);
    this.singleM60.add(m60Barrel);

    // Perforated heat shroud
    const m60Shroud = new THREE.Group();
    const shroudGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.65, 12, 1, true);
    shroudGeo.rotateX(Math.PI / 2);
    const shroudMesh = new THREE.Mesh(shroudGeo, darkTrimMat);
    shroudMesh.position.set(0, 0.01, -0.62);
    m60Shroud.add(shroudMesh);
    const ringGeo = new THREE.TorusGeometry(0.048, 0.007, 8, 16);
    for (let i = 0; i < 14; i++) {
      const ring = new THREE.Mesh(ringGeo, highlightMat);
      ring.position.set(0, 0.01, -0.32 - i * 0.042);
      m60Shroud.add(ring);
    }
    this.singleM60.add(m60Shroud);

    // Characteristic top carry handle
    const carryHandle = new THREE.Group();
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), darkTrimMat);
    handleBar.rotation.x = Math.PI / 2;
    handleBar.position.set(0.04, 0.15, -0.24);
    const handlePostF = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 6), gunSteelMat);
    handlePostF.position.set(0.04, 0.115, -0.17);
    const handlePostR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 6), gunSteelMat);
    handlePostR.position.set(0.04, 0.115, -0.31);
    carryHandle.add(handleBar, handlePostF, handlePostR);
    this.singleM60.add(carryHandle);

    // Front iron sight post
    const sightPost = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.045, 0.02), gunSteelMat);
    sightPost.position.set(0, 0.052, -1.36);
    this.singleM60.add(sightPost);

    // Gas cylinder beneath barrel & folded bipod legs
    const gasCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 8), darkTrimMat);
    gasCyl.geometry.rotateX(Math.PI / 2);
    gasCyl.position.set(0, -0.032, -0.80);
    this.singleM60.add(gasCyl);

    const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), darkTrimMat);
    bipodL.position.set(-0.035, -0.04, -0.92);
    bipodL.rotation.x = Math.PI / 2;
    const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), darkTrimMat);
    bipodR.position.set(0.035, -0.04, -0.92);
    bipodR.rotation.x = Math.PI / 2;
    this.singleM60.add(bipodL, bipodR);

    // Muzzle brake
    const sBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.12, 10), darkTrimMat);
    sBrake.geometry.rotateX(Math.PI / 2);
    sBrake.position.set(0, 0.01, -1.42);
    this.singleM60.add(sBrake);

    this.single.add(this.singleM60);

    // single muzzle flash
    const sFlashMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 });
    this.singleFlash = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), sFlashMat);
    this.singleFlash.position.set(0, 0.01, -1.52);
    this.single.add(this.singleFlash);
    this.singleLight = new THREE.PointLight(0xffaa33, 0, 8);
    this.singleLight.position.set(0, 0.01, -1.52);
    this.single.add(this.singleLight);

    // rocket pod (missile)
    this.singlePod = new THREE.Group();
    const podBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.65), darkTrimMat);
    podBox.position.set(0, 0.05, -0.45);
    this.singlePod.add(podBox);
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10);
    tubeGeo.rotateX(Math.PI / 2);
    for (let ty = -0.045; ty <= 0.045; ty += 0.09) {
      for (let tx = -0.06; tx <= 0.06; tx += 0.12) {
        const tube = new THREE.Mesh(tubeGeo, gunSteelMat);
        tube.position.set(tx, 0.05 + ty, -0.78);
        this.singlePod.add(tube);
      }
    }
    this.singlePod.visible = false;
    this.single.add(this.singlePod);

    this.group.add(this.single);

    // ============ HANDGUN (one-handed) ============
    this.handgun.position.set(0.26, -0.3, -0.55);
    const hgSlide = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.22), darkTrimMat);
    hgSlide.position.set(0, 0.03, -0.35);
    this.handgun.add(hgSlide);
    const hgFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.16), gunSteelMat);
    hgFrame.position.set(0, 0.005, -0.22);
    hgFrame.rotation.x = -0.15;
    this.handgun.add(hgFrame);
    const hgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.1, 8), gunSteelMat);
    hgBarrel.geometry.rotateX(Math.PI / 2);
    hgBarrel.position.set(0, 0.03, -0.47);
    this.handgun.add(hgBarrel);
    const hgGrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.09, 0.06), darkTrimMat);
    hgGrip.position.set(0, -0.05, -0.2);
    hgGrip.rotation.x = 0.25;
    this.handgun.add(hgGrip);
    this.group.add(this.handgun);

    this.casingGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 6);
    this.casingMat = brassMat;

    this.setWeapon('m60');
  }

  private shapeBarrel(refs: UnitRefs, ref: 'left' | 'right', radius: number, length: number) {
    const b = refs.barrel;
    b.scale.set(radius / 0.045, radius / 0.045, length / 1.5);
    b.position.set(0, 0.03, -length / 2);
    if (ref === 'left') this.leftBarrelLen = length; else this.rightBarrelLen = length;
  }

  public setWeapon(type: WeaponType) {
    this.weaponType = type;
    const isTwin = type === 'aa_gun' || type === 'heavy_cannon';
    this.twin.visible = isTwin;
    this.single.visible = type === 'm60' || type === 'missile';
    this.handgun.visible = type === 'handgun';

    if (type === 'aa_gun') {
      this.shapeBarrel(this.left, 'left', 0.05, 1.5);
      this.shapeBarrel(this.right, 'right', 0.05, 1.5);
      this.left.pod.visible = false;
      this.right.pod.visible = false;
    } else if (type === 'heavy_cannon') {
      this.shapeBarrel(this.left, 'left', 0.09, 1.75);
      this.shapeBarrel(this.right, 'right', 0.09, 1.75);
      this.left.pod.visible = false;
      this.right.pod.visible = false;
    } else if (type === 'm60') {
      this.singleM60.visible = true;
      this.singlePod.visible = false;
    } else if (type === 'missile') {
      this.singleM60.visible = false;
      this.singlePod.visible = true;
    }
  }

  public triggerRecoil(intensity: number = 1.0, side: number = -1) {
    this.targetRecoil = Math.min(1.4, this.targetRecoil + 0.5 * intensity);
    this.muzzleFlashTimer = 0.07;
    this.lastSide = side === 0 ? -1 : side;

    const isTwin = this.weaponType === 'aa_gun' || this.weaponType === 'heavy_cannon';
    const isMissile = this.weaponType === 'missile';

    if (isTwin) {
      const flip = (refs: UnitRefs, on: boolean) => {
        (refs.flash.material as THREE.MeshBasicMaterial).opacity = on ? 1.0 : 0;
        refs.flash.scale.setScalar(on ? (1.0 + Math.random() * 0.8) : 1);
        refs.light.intensity = on ? 4.5 * intensity : 0;
      };
      flip(this.left, this.lastSide < 0);
      flip(this.right, this.lastSide > 0);
    } else {
      (this.singleFlash.material as THREE.MeshBasicMaterial).opacity = 1;
      this.singleFlash.scale.setScalar(1.0 + Math.random() * 0.8);
      this.singleLight.intensity = 4.5 * intensity;
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
      velocity: new THREE.Vector3((isTwin ? this.lastSide : 1) * (0.8 + Math.random() * 0.6), 0.9 + Math.random() * 0.5, 0.3),
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

    // Twin guns: kick the fired side back
    this.left.group.position.set(-0.72 + swayX * 0.5, -0.52 + swayY, -0.85 + kick);
    this.right.group.position.set(0.72 - swayX * 0.5, -0.52 + swayY, -0.85 + kick);
    this.left.barrel.position.z = -this.leftBarrelLen / 2 + (this.lastSide < 0 ? kick * 1.2 : 0);
    this.right.barrel.position.z = -this.rightBarrelLen / 2 + (this.lastSide > 0 ? kick * 1.2 : 0);

    // One-handed weapon recoil
    this.single.position.set(0.28 + swayX, -0.30 + swayY + kick * 0.02, -0.6 + kick * 0.9);
    this.single.rotation.set(0.03 - kick * 0.12, -0.1, -0.02 + kick * 0.03);
    this.handgun.position.set(0.26 + swayX, -0.3 + swayY + kick * 0.02, -0.55 + kick * 0.9);

    // Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        (this.left.flash.material as THREE.MeshBasicMaterial).opacity = 0;
        (this.right.flash.material as THREE.MeshBasicMaterial).opacity = 0;
        this.left.light.intensity = 0;
        this.right.light.intensity = 0;
        (this.singleFlash.material as THREE.MeshBasicMaterial).opacity = 0;
        this.singleLight.intensity = 0;
      }
    }

    // Ejected casings
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
