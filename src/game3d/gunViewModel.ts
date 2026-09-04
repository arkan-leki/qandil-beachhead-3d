/**
 * First-Person Gun Viewmodel — TWO screen-side guns.
 *
 * Renders two separate turret barrels in the player's first-person view:
 * one rising from the bottom-LEFT of the screen, one from the bottom-RIGHT,
 * both angling in toward the horizon. Each shot fires a single side
 * alternately (left → right → left ...), with recoil + muzzle flash on the
 * fired gun and a small inward sway. Weapon type changes the barrel profile
 * (slim M60 / 23mm ZU / thick 105mm / rocket pods / handgun fallback).
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

  private leftUnit!: THREE.Group;
  private rightUnit!: THREE.Group;
  private left = {} as UnitRefs;
  private right = {} as UnitRefs;
  private handgunGroup = new THREE.Group();

  private leftBarrelLen = 1.5;
  private rightBarrelLen = 1.5;

  // Recoil & animation
  private currentRecoil: number = 0;
  private targetRecoil: number = 0;
  private muzzleFlashTimer: number = 0;
  private idleTime: number = 0;
  private lastSide: number = -1; // -1 left, +1 right, 0 centre
  private weaponType: WeaponType = 'aa_gun';

  // Spent brass casings
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

    // ---- Build one screen-side gun unit, mirrored per side ----
    const buildUnit = (side: -1 | 1): UnitRefs => {
      const refs = {} as UnitRefs;
      refs.group = new THREE.Group();

      // Bottom-left / bottom-right anchor (camera space), angled inward + up
      refs.group.position.set(side * 0.5, -0.30, -0.7);
      refs.group.rotation.set(0.22, side * 0.12, 0); // pitch up, yaw inward

      // Receiver / breech block emerging from the corner
      const baseGeo = new THREE.BoxGeometry(0.24, 0.24, 0.5);
      refs.base = new THREE.Mesh(baseGeo, gunSteelMat);
      refs.base.position.set(0, -0.12, 0.18);
      refs.group.add(refs.base);

      // Barrel (shared geometry; scaled per weapon in setWeapon)
      const barrelGeo = new THREE.CylinderGeometry(0.05, 0.055, 1.5, 14);
      barrelGeo.rotateX(Math.PI / 2); // along -Z
      const barrel = new THREE.Mesh(barrelGeo, gunSteelMat);
      barrel.position.set(0, 0.04, -0.75);
      refs.group.add(barrel);
      refs.barrel = barrel;

      // Muzzle brake at the tip
      const brakeGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.22, 14);
      brakeGeo.rotateX(Math.PI / 2);
      const brake = new THREE.Mesh(brakeGeo, darkTrimMat);
      brake.position.set(0, 0.04, -1.5);
      refs.group.add(brake);

      // Feed tray / sight rail on top
      const railGeo = new THREE.BoxGeometry(0.1, 0.05, 0.6);
      const rail = new THREE.Mesh(railGeo, highlightMat);
      rail.position.set(0, 0.14, -0.5);
      refs.group.add(rail);

      // Muzzle flash (hidden, at tip)
      const flashMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 });
      refs.flash = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), flashMat);
      refs.flash.position.set(0, 0.04, -1.62);
      refs.group.add(refs.flash);

      refs.light = new THREE.PointLight(0xffaa33, 0, 8);
      refs.light.position.set(0, 0.04, -1.62);
      refs.group.add(refs.light);

      // Rocket pod (shown for the missile weapon)
      refs.pod = new THREE.Group();
      const podBoxGeo = new THREE.BoxGeometry(0.22, 0.22, 0.6);
      const podBox = new THREE.Mesh(podBoxGeo, darkTrimMat);
      podBox.position.set(0, 0.05, -0.4);
      refs.pod.add(podBox);
      const tubeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10);
      tubeGeo.rotateX(Math.PI / 2);
      for (let ty = -0.05; ty <= 0.05; ty += 0.1) {
        for (let tx = -0.06; tx <= 0.06; tx += 0.12) {
          const tube = new THREE.Mesh(tubeGeo, gunSteelMat);
          tube.position.set(tx, 0.05 + ty, -0.72);
          refs.pod.add(tube);
        }
      }
      refs.pod.visible = false;
      refs.group.add(refs.pod);

      return refs;
    };

    this.left = buildUnit(-1);
    this.right = buildUnit(1);
    this.leftUnit = this.left.group;
    this.rightUnit = this.right.group;
    this.group.add(this.leftUnit, this.rightUnit);

    // ---- Handgun fallback (singleton, centre) ----
    const hgSlideGeo = new THREE.BoxGeometry(0.055, 0.05, 0.22);
    const hgSlide = new THREE.Mesh(hgSlideGeo, darkTrimMat);
    hgSlide.position.set(0, 0.03, -0.35);
    this.handgunGroup.add(hgSlide);
    const hgFrameGeo = new THREE.BoxGeometry(0.05, 0.06, 0.16);
    const hgFrame = new THREE.Mesh(hgFrameGeo, gunSteelMat);
    hgFrame.position.set(0, 0.005, -0.22);
    hgFrame.rotation.x = -0.15;
    this.handgunGroup.add(hgFrame);
    const hgBarrelGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.1, 8);
    hgBarrelGeo.rotateX(Math.PI / 2);
    const hgBarrel = new THREE.Mesh(hgBarrelGeo, gunSteelMat);
    hgBarrel.position.set(0, 0.03, -0.47);
    this.handgunGroup.add(hgBarrel);
    const hgGripGeo = new THREE.BoxGeometry(0.045, 0.09, 0.06);
    const hgGrip = new THREE.Mesh(hgGripGeo, darkTrimMat);
    hgGrip.position.set(0, -0.05, -0.2);
    hgGrip.rotation.x = 0.25;
    this.handgunGroup.add(hgGrip);
    this.handgunGroup.visible = false;
    this.group.add(this.handgunGroup);

    this.casingGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 6);
    this.casingMat = brassMat;

    this.setWeapon('aa_gun');
  }

  // Size a barrel to (radius, length) and keep it anchored at the unit origin.
  private shapeBarrel(refs: UnitRefs, ref: 'left' | 'right', radius: number, length: number) {
    const barrel = refs.barrel;
    barrel.scale.set(radius / 0.05, radius / 0.05, length / 1.5);
    barrel.position.set(0, 0.04, -length / 2);
    if (ref === 'left') this.leftBarrelLen = length; else this.rightBarrelLen = length;
  }

  public setWeapon(type: WeaponType) {
    this.weaponType = type;
    const showUnits = type !== 'handgun';
    this.leftUnit.visible = showUnits;
    this.rightUnit.visible = showUnits;
    this.handgunGroup.visible = type === 'handgun';

    if (type === 'm60') {
      this.shapeBarrel(this.left, 'left', 0.028, 1.15);
      this.shapeBarrel(this.right, 'right', 0.028, 1.15);
      this.left.pod.visible = false;
      this.right.pod.visible = false;
    } else if (type === 'aa_gun') {
      this.shapeBarrel(this.left, 'left', 0.05, 1.5);   // 23mm ZU-23
      this.shapeBarrel(this.right, 'right', 0.05, 1.5);
      this.left.pod.visible = false;
      this.right.pod.visible = false;
    } else if (type === 'heavy_cannon') {
      this.shapeBarrel(this.left, 'left', 0.09, 1.75);  // 105mm
      this.shapeBarrel(this.right, 'right', 0.09, 1.75);
      this.left.pod.visible = false;
      this.right.pod.visible = false;
    } else if (type === 'missile') {
      // Hidden barrels, rocket pods on each side
      this.left.barrel.visible = false;
      this.right.barrel.visible = false;
      this.left.pod.visible = true;
      this.right.pod.visible = true;
    } else {
      this.shapeBarrel(this.left, 'left', 0.028, 1.15);
      this.shapeBarrel(this.right, 'right', 0.028, 1.15);
      this.left.pod.visible = false;
      this.right.pod.visible = false;
    }
  }

  public triggerRecoil(intensity: number = 1.0, side: number = -1) {
    this.targetRecoil = Math.min(1.4, this.targetRecoil + 0.5 * intensity);
    this.muzzleFlashTimer = 0.07;
    this.lastSide = side === 0 ? -1 : side;

    // Flash the fired side on the dual-unit weapons; flash BOTH for missile
    const isMissile = this.weaponType === 'missile';
    const flip = (refs: UnitRefs, on: boolean) => {
      (refs.flash.material as THREE.MeshBasicMaterial).opacity = on ? 1.0 : 0;
      refs.flash.scale.setScalar(on ? (1.0 + Math.random() * 0.8) : 1);
      refs.light.intensity = on ? 4.5 * intensity : 0;
    };
    if (isMissile) {
      flip(this.left, true);
      flip(this.right, true);
    } else {
      flip(this.left, this.lastSide < 0);
      flip(this.right, this.lastSide > 0);
    }

    this.ejectCasing();
  }

  private ejectCasing() {
    const mesh = new THREE.Mesh(this.casingGeo, this.casingMat);
    mesh.position.set(this.lastSide > 0 ? 0.12 : -0.12, -0.05, 0.1);
    this.group.add(mesh);
    this.casings.push({
      mesh,
      velocity: new THREE.Vector3(this.lastSide * (0.8 + Math.random() * 0.6), 0.9 + Math.random() * 0.5, 0.3),
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

    // Left gun: recoil pushes the whole unit back along its barrel axis
    const kick = this.currentRecoil * 0.12;
    this.left.group.position.set(-0.5 + swayX * 0.5, -0.30 + swayY + kick * 0.02, -0.7 + kick);
    this.right.group.position.set(0.5 - swayX * 0.5, -0.30 + swayY + kick * 0.02, -0.7 + kick);

    // Individual barrel kick on the fired side
    this.left.barrel.position.z = -this.leftBarrelLen / 2 + (this.lastSide < 0 ? kick * 1.2 : 0);
    this.right.barrel.position.z = -this.rightBarrelLen / 2 + (this.lastSide > 0 ? kick * 1.2 : 0);

    // Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        (this.left.flash.material as THREE.MeshBasicMaterial).opacity = 0;
        (this.right.flash.material as THREE.MeshBasicMaterial).opacity = 0;
        this.left.light.intensity = 0;
        this.right.light.intensity = 0;
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
