/**
 * First-Person Gun Viewmodel (Beach Head Bunker Weapon).
 * Mounted directly in the player's first-person perspective (bottom-right of viewport),
 * featuring detailed receiver, ribbed cooling shroud, front post sight, animated recoil,
 * muzzle flash, and spent shell casing ejection.
 */
import * as THREE from 'three';
import { WeaponType } from '../types';

export class GunViewModel {
  public group: THREE.Group;
  private barrelMesh: THREE.Mesh;
  private heatShieldGroup: THREE.Group;
  private receiverMesh: THREE.Mesh;
  private sightPost: THREE.Mesh;
  private muzzleFlashMesh: THREE.Mesh;
  private muzzleFlashLight: THREE.PointLight;
  private cannonBarrel: THREE.Mesh;
  private cannonBarrelR: THREE.Mesh;
  private missilePod: THREE.Group;
  // ZU-23-2 twin 23mm recoil barrels (shown for the AA gun)
  private twinBarrelGroup: THREE.Group;
  private twinBarrelL: THREE.Mesh;
  private twinBarrelR: THREE.Mesh;
  // .45 handgun viewmodel
  private handgunGroup: THREE.Group;

  // Recoil & Animation
  private currentRecoil: number = 0;
  private targetRecoil: number = 0;
  private muzzleFlashTimer: number = 0;
  private idleTime: number = 0;
  private lastSide: number = 0;

  // Active weapon mode
  private weaponType: WeaponType = 'aa_gun';

  // Spent brass casings pool
  private casings: { mesh: THREE.Mesh; velocity: THREE.Vector3; rotSpeed: THREE.Vector3; life: number }[] = [];
  private casingGeo: THREE.CylinderGeometry;
  private casingMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'gun_viewmodel';

    // Charcoal steel gun material
    const gunSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1f2326,
      roughness: 0.35,
      metalness: 0.85,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x121415,
      roughness: 0.5,
      metalness: 0.9,
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: 0x3d4347,
      roughness: 0.25,
      metalness: 0.7,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc8a652,
      roughness: 0.3,
      metalness: 0.9,
    });

    // 1. Primary Receiver Body (Heavy machine gun / autocannon breech)
    const receiverGeo = new THREE.BoxGeometry(0.14, 0.16, 0.55);
    this.receiverMesh = new THREE.Mesh(receiverGeo, gunSteelMat);
    this.receiverMesh.position.set(0, 0, 0);
    this.group.add(this.receiverMesh);

    // Top receiver cover / feed tray
    const topCoverGeo = new THREE.BoxGeometry(0.13, 0.05, 0.42);
    const topCover = new THREE.Mesh(topCoverGeo, highlightMat);
    topCover.position.set(0, 0.09, -0.04);
    this.group.add(topCover);

    // Rear sight notch block
    const rearSightGeo = new THREE.BoxGeometry(0.06, 0.04, 0.04);
    const rearSight = new THREE.Mesh(rearSightGeo, darkTrimMat);
    rearSight.position.set(0, 0.12, 0.12);
    this.group.add(rearSight);

    // Carrying Handle / Optic Rail
    const handleGeo = new THREE.BoxGeometry(0.04, 0.06, 0.22);
    const handle = new THREE.Mesh(handleGeo, darkTrimMat);
    handle.position.set(0, 0.13, -0.08);
    this.group.add(handle);

    // Ammo Box / Belt Feed Housing on Left
    const ammoBoxGeo = new THREE.BoxGeometry(0.09, 0.13, 0.2);
    const ammoBox = new THREE.Mesh(ammoBoxGeo, darkTrimMat);
    ammoBox.position.set(-0.11, -0.02, 0.02);
    this.group.add(ammoBox);

    // Visible brass rounds in feed tray
    const roundGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8);
    roundGeo.rotateZ(Math.PI / 2);
    for (let r = -0.04; r <= 0.04; r += 0.022) {
      const round = new THREE.Mesh(roundGeo, brassMat);
      round.position.set(-0.065, 0.06, r);
      this.group.add(round);
    }

    // 2. Long Fluted Autocannon Barrel (extending forward along -Z)
    const barrelLength = 1.15;
    const barrelGeo = new THREE.CylinderGeometry(0.026, 0.028, barrelLength, 12);
    barrelGeo.rotateX(Math.PI / 2);
    this.barrelMesh = new THREE.Mesh(barrelGeo, gunSteelMat);
    this.barrelMesh.position.set(0, 0.01, -0.27 - barrelLength / 2);
    this.group.add(this.barrelMesh);

    // ---- ZU-23-2 twin side-by-side 23mm barrels (replaces the single rifle barrel for AA) ----
    this.twinBarrelGroup = new THREE.Group();

    // Central split breech/receiver between the two barrels
    const zuBreechGeo = new THREE.BoxGeometry(0.20, 0.18, 0.5);
    const zuBreech = new THREE.Mesh(zuBreechGeo, gunSteelMat);
    zuBreech.position.set(0, 0.01, -0.2);
    this.twinBarrelGroup.add(zuBreech);

    // Twin recoil barrels
    const zuBarrelGeo = new THREE.CylinderGeometry(0.028, 0.03, 1.25, 12);
    zuBarrelGeo.rotateX(Math.PI / 2);
    this.twinBarrelL = new THREE.Mesh(zuBarrelGeo, gunSteelMat);
    this.twinBarrelR = new THREE.Mesh(zuBarrelGeo, gunSteelMat);
    this.twinBarrelL.position.set(-0.12, 0.03, -0.95);
    this.twinBarrelR.position.set(0.12, 0.03, -0.95);
    this.twinBarrelGroup.add(this.twinBarrelL);
    this.twinBarrelGroup.add(this.twinBarrelR);

    // Twin slotted muzzle brakes + flash hiders
    const zuBrakeGeo = new THREE.CylinderGeometry(0.042, 0.05, 0.16, 10);
    zuBrakeGeo.rotateX(Math.PI / 2);
    for (const bx of [-0.085, 0.085]) {
      const brake = new THREE.Mesh(zuBrakeGeo, darkTrimMat);
      brake.position.set(bx, 0.03, -1.56);
      this.twinBarrelGroup.add(brake);
      // side vent slot
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.09), highlightMat);
      slot.position.set(bx, 0.06, -1.55);
      this.twinBarrelGroup.add(slot);
    }

    // Twin ammo feed chutes & rear grips (ZU mounts are crew-operated)
    const zuFeedGeo = new THREE.BoxGeometry(0.05, 0.16, 0.34);
    for (const fx of [-0.13, 0.13]) {
      const feed = new THREE.Mesh(zuFeedGeo, darkTrimMat);
      feed.position.set(fx, -0.02, 0.02);
      this.twinBarrelGroup.add(feed);
    }

    // Rear optics/sight rail between barrels
    const zuSightRailGeo = new THREE.BoxGeometry(0.16, 0.05, 0.3);
    const zuSightRail = new THREE.Mesh(zuSightRailGeo, darkTrimMat);
    zuSightRail.position.set(0, 0.14, -0.1);
    this.twinBarrelGroup.add(zuSightRail);

    this.twinBarrelGroup.visible = false;
    this.group.add(this.twinBarrelGroup);

    // 3. Perforated Heat Shield / Cooling Jacket Shroud (matches screenshot ribs!)
    this.heatShieldGroup = new THREE.Group();
    const shroudGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.65, 12, 1, true);
    shroudGeo.rotateX(Math.PI / 2);
    const shroudMesh = new THREE.Mesh(shroudGeo, darkTrimMat);
    shroudMesh.position.set(0, 0.01, -0.62);
    this.heatShieldGroup.add(shroudMesh);

    // Ribbed cooling rings along the shroud
    const ringGeo = new THREE.TorusGeometry(0.048, 0.007, 8, 16);
    for (let i = 0; i < 14; i++) {
      const ring = new THREE.Mesh(ringGeo, highlightMat);
      ring.position.set(0, 0.01, -0.32 - i * 0.042);
      this.heatShieldGroup.add(ring);
    }
    this.group.add(this.heatShieldGroup);

    // 4. Front Sight Post at muzzle
    const frontSightBase = new THREE.BoxGeometry(0.03, 0.04, 0.03);
    const frontBase = new THREE.Mesh(frontSightBase, darkTrimMat);
    frontBase.position.set(0, 0.05, -1.35);
    this.group.add(frontBase);

    const postBlade = new THREE.BoxGeometry(0.008, 0.035, 0.015);
    this.sightPost = new THREE.Mesh(postBlade, highlightMat);
    this.sightPost.position.set(0, 0.08, -1.35);
    this.group.add(this.sightPost);

    // 5. Flash Suppressor / Muzzle Brake
    const muzzleBrakeGeo = new THREE.CylinderGeometry(0.036, 0.04, 0.12, 10);
    muzzleBrakeGeo.rotateX(Math.PI / 2);
    const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, darkTrimMat);
    muzzleBrake.position.set(0, 0.01, -1.42);
    this.group.add(muzzleBrake);

    // 6. Muzzle Flash Starburst (hidden unless firing)
    const flashGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0.01, -1.52);
    this.group.add(this.muzzleFlashMesh);

    // Dynamic muzzle flash light
    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 8);
    this.muzzleFlashLight.position.set(0, 0.01, -1.52);
    this.group.add(this.muzzleFlashLight);

    // 7. Twin 105mm AP Cannons (LEFT + RIGHT, fire alternately per shot)
    const cannonGeo = new THREE.CylinderGeometry(0.055, 0.065, 1.25, 14);
    cannonGeo.rotateX(Math.PI / 2);
    // left cannon group
    this.cannonBarrel = new THREE.Mesh(cannonGeo, gunSteelMat);
    this.cannonBarrel.position.set(-0.14, 0.01, -0.9);
    this.cannonBarrel.visible = false;
    this.group.add(this.cannonBarrel);
    // right cannon group
    this.cannonBarrelR = new THREE.Mesh(cannonGeo, gunSteelMat);
    this.cannonBarrelR.position.set(0.14, 0.01, -0.9);
    this.cannonBarrelR.visible = false;
    this.group.add(this.cannonBarrelR);

    // Heavy muzzle brakes (both cannons)
    const cannonBrakeGeo = new THREE.BoxGeometry(0.14, 0.12, 0.22);
    const cannonBrake = new THREE.Mesh(cannonBrakeGeo, darkTrimMat);
    cannonBrake.position.set(-0.14, 0.01, -1.52);
    this.cannonBarrel.add(cannonBrake);
    const cannonBrakeR = new THREE.Mesh(cannonBrakeGeo, darkTrimMat);
    cannonBrakeR.position.set(0.14, 0.01, -1.52);
    this.cannonBarrelR.add(cannonBrakeR);

    // 8. Missile Pod Launcher Attachment (Switched with [3]/[M])
    this.missilePod = new THREE.Group();
    const podBoxGeo = new THREE.BoxGeometry(0.24, 0.22, 0.65);
    const podBox = new THREE.Mesh(podBoxGeo, darkTrimMat);
    podBox.position.set(0, 0.05, -0.45);
    this.missilePod.add(podBox);

    // Quad rocket tube tips
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10);
    tubeGeo.rotateX(Math.PI / 2);
    for (let ty = -0.045; ty <= 0.045; ty += 0.09) {
      for (let tx = -0.06; tx <= 0.06; tx += 0.12) {
        const tube = new THREE.Mesh(tubeGeo, gunSteelMat);
        tube.position.set(tx, 0.05 + ty, -0.78);
        this.missilePod.add(tube);
        // Armed missile nose cone
        const warheadGeo = new THREE.ConeGeometry(0.035, 0.1, 8);
        warheadGeo.rotateX(-Math.PI / 2);
        const warhead = new THREE.Mesh(warheadGeo, brassMat);
        warhead.position.set(tx, 0.05 + ty, -0.83);
        this.missilePod.add(warhead);
      }
    }
    this.missilePod.visible = false;
    this.group.add(this.missilePod);

    // 9. .45 Handgun (compact sidearm shown bottom-center)
    this.handgunGroup = new THREE.Group();
    // slide + frame
    const hgSlideGeo = new THREE.BoxGeometry(0.055, 0.05, 0.22);
    const hgSlide = new THREE.Mesh(hgSlideGeo, darkTrimMat);
    hgSlide.position.set(0, 0.03, -0.35);
    this.handgunGroup.add(hgSlide);
    const hgFrameGeo = new THREE.BoxGeometry(0.05, 0.06, 0.16);
    const hgFrame = new THREE.Mesh(hgFrameGeo, gunSteelMat);
    hgFrame.position.set(0, 0.005, -0.22);
    hgFrame.rotation.x = -0.15;
    this.handgunGroup.add(hgFrame);
    // barrel stub
    const hgBarrelGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.1, 8);
    hgBarrelGeo.rotateX(Math.PI / 2);
    const hgBarrel = new THREE.Mesh(hgBarrelGeo, gunSteelMat);
    hgBarrel.position.set(0, 0.03, -0.47);
    this.handgunGroup.add(hgBarrel);
    // grip
    const hgGripGeo = new THREE.BoxGeometry(0.045, 0.09, 0.06);
    const hgGrip = new THREE.Mesh(hgGripGeo, darkTrimMat);
    hgGrip.position.set(0, -0.05, -0.2);
    hgGrip.rotation.x = 0.25;
    this.handgunGroup.add(hgGrip);
    // front/rear sights
    const hgSightGeo = new THREE.BoxGeometry(0.01, 0.02, 0.012);
    const hgRear = new THREE.Mesh(hgSightGeo, highlightMat);
    hgRear.position.set(0, 0.06, -0.34);
    this.handgunGroup.add(hgRear);
    const hgFront = new THREE.Mesh(hgSightGeo, highlightMat);
    hgFront.position.set(0, 0.06, -0.46);
    this.handgunGroup.add(hgFront);
    this.handgunGroup.visible = false;
    this.group.add(this.handgunGroup);

    // Casings template
    this.casingGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 6);
    this.casingMat = brassMat;

    // Anchor position in camera space: bottom right pointing forward toward crosshairs
    this.group.position.set(0.26, -0.28, -0.62);
    this.group.rotation.set(0.04, -0.08, -0.02);
  }

  public setWeapon(type: WeaponType) {
    this.weaponType = type;
    if (type === 'm60') {
      // M60: single long barrel + cooling shroud
      this.barrelMesh.visible = true;
      this.heatShieldGroup.visible = true;
      this.twinBarrelGroup.visible = false;
      this.cannonBarrel.visible = false;
      this.cannonBarrelR.visible = false;
      this.missilePod.visible = false;
      this.handgunGroup.visible = false;
    } else if (type === 'aa_gun') {
      // ZU-23-2 twin-barrel AA gun
      this.barrelMesh.visible = false;
      this.heatShieldGroup.visible = false;
      this.twinBarrelGroup.visible = true;
      this.cannonBarrel.visible = false;
      this.cannonBarrelR.visible = false;
      this.missilePod.visible = false;
      this.handgunGroup.visible = false;
    } else if (type === 'heavy_cannon') {
      this.barrelMesh.visible = false;
      this.heatShieldGroup.visible = false;
      this.twinBarrelGroup.visible = false;
      this.cannonBarrel.visible = true;
      this.cannonBarrelR.visible = true;
      this.missilePod.visible = false;
      this.handgunGroup.visible = false;
    } else if (type === 'missile') {
      this.barrelMesh.visible = false;
      this.heatShieldGroup.visible = false;
      this.twinBarrelGroup.visible = false;
      this.cannonBarrel.visible = false;
      this.cannonBarrelR.visible = false;
      this.missilePod.visible = true;
      this.handgunGroup.visible = false;
    } else if (type === 'handgun') {
      this.barrelMesh.visible = false;
      this.heatShieldGroup.visible = false;
      this.twinBarrelGroup.visible = false;
      this.cannonBarrel.visible = false;
      this.cannonBarrelR.visible = false;
      this.missilePod.visible = false;
      this.handgunGroup.visible = true;
    }
  }

  public triggerRecoil(intensity: number = 1.0, side: number = 0) {
    this.targetRecoil = Math.min(1.4, this.targetRecoil + 0.5 * intensity);
    this.muzzleFlashTimer = 0.07;
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
    this.muzzleFlashMesh.scale.set(
      1.0 + Math.random() * 0.8,
      1.0 + Math.random() * 0.8,
      1.0 + Math.random() * 0.8
    );
    this.muzzleFlashLight.intensity = 4.5 * intensity;
    this.lastSide = side;

    // Muzzle flash appears on whichever side barrel just fired
    if (this.weaponType === 'aa_gun' && side !== 0) {
      this.muzzleFlashMesh.position.x = side * 0.12;
      this.muzzleFlashLight.position.x = side * 0.12;
    } else if (this.weaponType === 'heavy_cannon' && side !== 0) {
      this.muzzleFlashMesh.position.x = side * 0.14;
      this.muzzleFlashLight.position.x = side * 0.14;
    } else {
      this.muzzleFlashMesh.position.x = 0;
      this.muzzleFlashLight.position.x = 0;
    }

    // Eject spent brass casing
    this.ejectCasing();
  }

  private ejectCasing() {
    const mesh = new THREE.Mesh(this.casingGeo, this.casingMat);
    // Eject position at side port
    mesh.position.set(0.08, -0.02, 0.05);
    this.group.add(mesh);

    this.casings.push({
      mesh,
      velocity: new THREE.Vector3(
        0.8 + Math.random() * 0.6, // shoot right
        0.9 + Math.random() * 0.5, // arc up
        0.3 + Math.random() * 0.4  // eject slightly back
      ),
      rotSpeed: new THREE.Vector3(
        Math.random() * 15,
        Math.random() * 15,
        Math.random() * 15
      ),
      life: 0,
    });
  }

  public update(dt: number) {
    this.idleTime += dt;

    // 1. Recoil spring physics
    this.currentRecoil = THREE.MathUtils.lerp(this.currentRecoil, this.targetRecoil, dt * 28);
    this.targetRecoil = Math.max(0, this.targetRecoil - dt * 6.5);

    // 2. Idle sway (breathing motion)
    const swayX = Math.sin(this.idleTime * 1.5) * 0.003;
    const swayY = Math.cos(this.idleTime * 3.0) * 0.003;

    // Apply recoil translation along gun axis
    this.group.position.set(
      0.26 + swayX,
      -0.28 + swayY + this.currentRecoil * 0.02,
      -0.62 + this.currentRecoil * 0.09
    );
    this.group.rotation.set(
      0.04 - this.currentRecoil * 0.12,
      -0.08,
      -0.02 + this.currentRecoil * 0.03
    );

    // 2b. Cannon recoil kick on the fired side (twin cannons)
    const ck = this.currentRecoil * 0.12;
    this.cannonBarrel.position.z = -0.9 - (this.lastSide < 0 ? ck : 0);
    this.cannonBarrelR.position.z = -0.9 - (this.lastSide > 0 ? ck : 0);
    // Twin ZU barrels kick on their fired side
    const ak = this.currentRecoil * 0.1;
    this.twinBarrelL.position.z = -0.95 - (this.lastSide < 0 ? ak : 0);
    this.twinBarrelR.position.z = -0.95 - (this.lastSide > 0 ? ak : 0);

    // 3. Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // 4. Update ejected casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life += dt;
      c.velocity.y -= 9.8 * dt; // gravity
      c.mesh.position.addScaledVector(c.velocity, dt);
      c.mesh.rotation.x += c.rotSpeed.x * dt;
      c.mesh.rotation.y += c.rotSpeed.y * dt;

      // Remove after falling out of view
      if (c.life > 0.65 || c.mesh.position.y < -1.5) {
        this.group.remove(c.mesh);
        this.casings.splice(i, 1);
      }
    }
  }
}
