# Qandil Beachhead 3D: Mountain Redoubt

A high-intensity 3D fixed-turret defense arcade game inspired by the classic *Beach Head* franchise, built entirely with React 19, TypeScript, and Three.js. Defend a rugged mountain redoubt overlooking an active alpine combat pass against waves of infantry, armored tanks, BTR-80 APCs, attack helicopters, high-speed MiG-29 fighters, and airborne paratroopers.

No external asset downloads required — all 3D combat vehicles, weapons, terrain heights, and procedural sound effects are synthesized dynamically at runtime.

---

## Combat Controls

| Control | Action |
| :--- | :--- |
| **Mouse / Touch Drag (Left Screen)** | Aim Turret & Camera (360° yaw, -12° to +48° pitch) |
| **Left Click / Spacebar / Touch Fire Button** | Fire Active Weapon |
| **Right Click / Shift / Z / Double-Tap Zoom** | Toggle Binocular Zoom (1.0x to 5.0x) |
| **1 / 2 / 3 / 4 / 5** | Switch Weapon (M60, AA 20mm Twin, Heavy Cannon, Stinger, Handgun) |
| **R** | Manual Weapon Reload |
| **B** | Request Close Air Support (CAS Airstrike) |
| **F** | Launch Illumination Flare (Night Missions) |

---

## Arsenal Overview

- **M60 General Purpose Machine Gun (Key 1)**: Rapid-fire 7.62mm suppression weapon. Exceptional for cutting down advancing infantry and airborne paratroopers before they touch down.
- **Twin 20mm Anti-Aircraft Cannons (Key 2)**: Heavy sustained fire effective against low-altitude attack helicopters, APCs, and strafing MiG-29 fighters.
- **120mm Heavy Cannon (Key 3)**: High-explosive anti-armor rounds. Direct hits penetrate main battle tanks; high splash radius neutralizes clustered targets.
- **FIM-92 Stinger SAMs (Key 4)**: Heat-seeking surface-to-air missiles with lock-on capability against airborne helicopters and jets.
- **Sidearm Handgun (Key 5)**: Infinite-reserve emergency backup weapon with fast tactical reload.
- **Airstrike (Key B)**: Calls in friendly close air support bombers delivering a devastating carpet-bombing run across the mountain valley.

---

## Key Features & Architecture

- **Sub-Stepped Ballistics**: High-velocity projectile movement is split into sub-step collision sweeps to completely eliminate projectile tunneling against fast targets.
- **Interception Mechanics**: Incoming enemy tank shells can be shot out of the sky in mid-flight with precision machine-gun fire.
- **Procedural Audio & Models**: Web Audio API synthesizer for gunshots, explosions, rotor chop, jet engines, and atmospheric sound without bulky audio files.
- **Cached Asset Architecture**: Reusable geometry and material singletons eliminate per-frame GPU allocations and memory leaks.
- **Dynamic Night Combat**: Low-light night operations equipped with searchlight beam tracking and illumination flare physics.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Production build
npm run build
```

