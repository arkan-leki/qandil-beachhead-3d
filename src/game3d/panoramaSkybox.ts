/**
 * Realistic 360-Degree Mountain Panorama & Landscape Generator
 * Uses photorealistic generated panoramic mountain sky photography for authentic far eyesight,
 * and procedural CPU textures for the ground battlefield terrain.
 */
import * as THREE from 'three';
import daySkyUrl from '../assets/images/mountain_sky_day_1788865460523.jpg';
import nightSkyUrl from '../assets/images/mountain_sky_night_1788865475431.jpg';

/**
 * Creates a high-definition 360 panorama canvas texture representing
 * a photorealistic mountain valley under a blue sky with cumulus clouds.
 */
export function create360PanoramaTexture(): THREE.CanvasTexture {
  return create360DayPanoramaTexture();
}

/**
 * Creates a 360 day panorama texture using photorealistic mountain photography.
 * Composited onto a 360 canvas with mirrored panels for 100% seamless looping,
 * realistic zenith sky, and smooth horizon fog blending.
 */
export function create360DayPanoramaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Initial realistic sky gradient (from deep zenith blue down to soft horizon haze)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0.0, '#2b65ab'); // Zenith mountain sky blue
  skyGrad.addColorStop(0.35, '#5b8fcb'); // Clear azure
  skyGrad.addColorStop(0.65, '#99bde1'); // Distant atmospheric haze
  skyGrad.addColorStop(0.9, '#c8daf0'); // Lower horizon glow
  skyGrad.addColorStop(1.0, '#9ec0de'); // Horizon fog blend color
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // 2. Load the realistic generated daytime mountain sky image
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const renderImageOntoCanvas = () => {
    // Fill background with realistic sky gradient
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Place photorealistic mountains across the 360 horizon:
    // Render 2 panels (Panel 1 normal, Panel 2 mirrored horizontally)
    // for mathematical 100% seamless continuity with zero seam lines.
    const panelWidth = width / 2; // 1024px each
    // Position mountains along eye-level horizon (y = 160 to 880)
    const drawY = 160;
    const drawHeight = 720;

    // Panel 1: Left 180 degrees
    ctx.drawImage(img, 0, drawY, panelWidth, drawHeight);

    // Panel 2: Right 180 degrees (mirrored horizontally for seamless 360 loop)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, drawY, panelWidth, drawHeight);
    ctx.restore();

    // Soft atmospheric feather at the top of the mountains into the upper sky
    const topFeather = ctx.createLinearGradient(0, drawY, 0, drawY + 80);
    topFeather.addColorStop(0, '#4a82c4');
    topFeather.addColorStop(0.3, 'rgba(74, 130, 196, 0.45)');
    topFeather.addColorStop(1, 'rgba(74, 130, 196, 0.0)');
    ctx.fillStyle = topFeather;
    ctx.fillRect(0, drawY, width, 80);

    // Smooth gradient blend at the bottom into the battlefield horizon fog (#9ec0de)
    const bottomFeather = ctx.createLinearGradient(0, drawY + drawHeight - 140, 0, height);
    bottomFeather.addColorStop(0, 'rgba(158, 192, 222, 0.0)');
    bottomFeather.addColorStop(0.65, 'rgba(158, 192, 222, 0.7)');
    bottomFeather.addColorStop(1, '#9ec0de');
    ctx.fillStyle = bottomFeather;
    ctx.fillRect(0, drawY + drawHeight - 140, width, height - (drawY + drawHeight - 140));

    texture.needsUpdate = true;
  };

  img.onload = renderImageOntoCanvas;
  img.onerror = () => {
    // If bundled asset failed, try static fallback
    if (img.src !== window.location.origin + '/textures/mountain_sky_day.jpg') {
      img.src = '/textures/mountain_sky_day.jpg';
    }
  };
  img.src = daySkyUrl;

  return texture;
}

/**
 * Creates a 360 NIGHT panorama texture using photorealistic nocturnal mountain photography.
 * Composited onto a 360 canvas with mirrored panels for 100% seamless looping,
 * atmospheric starfield, realistic moonlight, and deep nocturnal fog blending.
 */
export function create360NightPanoramaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Initial realistic nocturnal gradient (zenith inky dark to night horizon)
  const nightSkyGrad = ctx.createLinearGradient(0, 0, 0, height);
  nightSkyGrad.addColorStop(0.0, '#02040b'); // Inky zenith black-indigo
  nightSkyGrad.addColorStop(0.35, '#050a1b'); // Nocturnal deep blue
  nightSkyGrad.addColorStop(0.65, '#081228'); // Far mountain horizon
  nightSkyGrad.addColorStop(0.85, '#0c1735'); // Atmospheric nocturnal haze
  nightSkyGrad.addColorStop(1.0, '#0a1230'); // Night fog blend color
  ctx.fillStyle = nightSkyGrad;
  ctx.fillRect(0, 0, width, height);

  // Faint celestial starfield in upper dome
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 280; i++) {
    const sx = pseudoRandom(i * 3 + 1) * width;
    const sy = Math.pow(pseudoRandom(i * 3 + 2), 1.6) * (height * 0.42);
    const bright = 0.3 + pseudoRandom(i * 3 + 3) * 0.7;
    const r = 0.5 + pseudoRandom(i * 5 + 1) * 1.2;
    ctx.fillStyle = `rgba(220, 235, 255, ${bright})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // 2. Load the realistic generated nighttime mountain sky image
  const img = new Image();
  img.crossOrigin = 'anonymous';

  const renderNightImageOntoCanvas = () => {
    // Fill base night sky
    ctx.fillStyle = nightSkyGrad;
    ctx.fillRect(0, 0, width, height);

    // Re-draw starfield in upper sky
    for (let i = 0; i < 320; i++) {
      const sx = pseudoRandom(i * 3 + 1) * width;
      const sy = Math.pow(pseudoRandom(i * 3 + 2), 1.6) * (height * 0.38);
      const bright = 0.35 + pseudoRandom(i * 3 + 3) * 0.65;
      const r = 0.5 + pseudoRandom(i * 5 + 1) * 1.2;
      ctx.fillStyle = `rgba(220, 235, 255, ${bright})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Place photorealistic dark night mountains across the 360 horizon:
    // Render 2 panels (Panel 1 normal, Panel 2 mirrored horizontally) for 100% seamless 360 loop
    const panelWidth = width / 2;
    const drawY = 160;
    const drawHeight = 720;

    // Panel 1: Left 180 degrees
    ctx.drawImage(img, 0, drawY, panelWidth, drawHeight);

    // Panel 2: Right 180 degrees (mirrored horizontally for seamless 360 loop)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, drawY, panelWidth, drawHeight);
    ctx.restore();

    // Atmospheric feather at the top into the midnight zenith
    const topFeather = ctx.createLinearGradient(0, drawY, 0, drawY + 80);
    topFeather.addColorStop(0, '#050a1a');
    topFeather.addColorStop(0.4, 'rgba(5, 10, 26, 0.45)');
    topFeather.addColorStop(1, 'rgba(5, 10, 26, 0.0)');
    ctx.fillStyle = topFeather;
    ctx.fillRect(0, drawY, width, 80);

    // Smooth gradient blend at the bottom into the nocturnal battlefield fog (#0a1230)
    const bottomFeather = ctx.createLinearGradient(0, drawY + drawHeight - 140, 0, height);
    bottomFeather.addColorStop(0, 'rgba(10, 18, 48, 0.0)');
    bottomFeather.addColorStop(0.65, 'rgba(10, 18, 48, 0.7)');
    bottomFeather.addColorStop(1, '#0a1230');
    ctx.fillStyle = bottomFeather;
    ctx.fillRect(0, drawY + drawHeight - 140, width, height - (drawY + drawHeight - 140));

    texture.needsUpdate = true;
  };

  img.onload = renderNightImageOntoCanvas;
  img.onerror = () => {
    if (img.src !== window.location.origin + '/textures/mountain_sky_night.jpg') {
      img.src = '/textures/mountain_sky_night.jpg';
    }
  };
  img.src = nightSkyUrl;

  return texture;
}

/**
 * Creates the 360-degree panorama skydome enclosing the game world.
 * Contains both Day and Night panorama meshes configured with depthWrite=false
 * and deterministic renderOrder to enable ultra-smooth crossfading without artifacts.
 */
export function create360PanoramaDome(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'panorama_360_dome';
  group.position.set(0, 40, 0);

  const dayTexture = create360DayPanoramaTexture();
  const nightTexture = create360NightPanoramaTexture();

  // Outer Night Dome (radius 600, inverted sphere backdrop)
  const nightGeo = new THREE.SphereGeometry(600, 48, 32);
  const nightMat = new THREE.MeshBasicMaterial({
    map: nightTexture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    transparent: true,
    opacity: 1.0,
  });
  const nightMesh = new THREE.Mesh(nightGeo, nightMat);
  nightMesh.name = 'panorama_night_mesh';
  nightMesh.renderOrder = -2;
  group.add(nightMesh);

  // Inner Day Dome (radius 599.5, crossfades smoothly based on dayNightT)
  const dayGeo = new THREE.SphereGeometry(599.5, 48, 32);
  const dayMat = new THREE.MeshBasicMaterial({
    map: dayTexture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    transparent: true,
    opacity: 1.0,
  });
  const dayMesh = new THREE.Mesh(dayGeo, dayMat);
  dayMesh.name = 'panorama_day_mesh';
  dayMesh.renderOrder = -1;
  group.add(dayMesh);

  return group;
}

/**
 * Updates the day/night blend of the 360 mountain panorama dome.
 * @param dome The panorama skydome group
 * @param nightFactor 0 = full daytime, 1 = full nighttime
 */
export function updatePanoramaDayNight(dome: THREE.Object3D | null | undefined, nightFactor: number) {
  if (!dome) return;
  const k = Math.min(Math.max(nightFactor, 0), 1);
  const dayMesh = dome.getObjectByName('panorama_day_mesh') as THREE.Mesh | undefined;
  const nightMesh = dome.getObjectByName('panorama_night_mesh') as THREE.Mesh | undefined;

  if (dayMesh && dayMesh.material) {
    const mat = dayMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 1.0 - k;
    dayMesh.visible = mat.opacity > 0.002;
  }
  if (nightMesh && nightMesh.material) {
    const mat = nightMesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 1.0;
    nightMesh.visible = k > 0.002 || !dayMesh;
  }
}

/**
 * Procedural grass and dirt road ground texture matching Beach Head
 */
export function createGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // Multi-tone grass/earth base with vertical banding for organic depth
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 2048);
  baseGrad.addColorStop(0, '#5a7a40');
  baseGrad.addColorStop(0.5, '#637e45');
  baseGrad.addColorStop(1, '#4f6b38');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 2048, 2048);

  // Large soft mottling patches (wet/dry areas)
  for (let d = 0; d < 120; d++) {
    const px = Math.random() * 2048;
    const py = Math.random() * 2048;
    const pr = 60 + Math.random() * 180;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    const dry = Math.random() < 0.45;
    g.addColorStop(0, dry ? 'rgba(133,124,84,0.28)' : 'rgba(38,58,30,0.30)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine grass-blade and earth speckle noise (dense)
  for (let i = 0; i < 220000; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 2048;
    const c = Math.random();
    if (c < 0.30) {
      ctx.fillStyle = 'rgba(122,148,79,0.55)'; // sunlit green blades
    } else if (c < 0.55) {
      ctx.fillStyle = 'rgba(72,96,48,0.55)'; // olive blades
    } else if (c < 0.72) {
      ctx.fillStyle = 'rgba(148,137,90,0.5)'; // dry straw
    } else if (c < 0.86) {
      ctx.fillStyle = 'rgba(52,70,38,0.5)'; // deep shadow tuft
    } else {
      ctx.fillStyle = 'rgba(96,84,58,0.45)'; // exposed earth
    }
    const len = 2 + Math.random() * 5;
    ctx.fillRect(x, y, 1 + Math.random() * 2, len);
  }

  // Scattered small stones & pebbles
  for (let s = 0; s < 2600; s++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 2048;
    const r = 1 + Math.random() * 3.2;
    const shade = 96 + Math.random() * 70;
    ctx.fillStyle = `rgba(${shade},${shade - 8},${shade - 22},${0.5 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.75, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    // subtle highlight dot
    ctx.fillStyle = 'rgba(220,210,190,0.18)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cross-hatched vehicle-track wear lines for battlefield texture
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(70,60,42,0.22)';
  for (let t = 0; t < 30; t++) {
    const y = Math.random() * 2048;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 2048; x += 40) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + t) * 6);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(56, 56); // high frequency so it reads as ground grain, not tiling blobs
  texture.anisotropy = 16;
  return texture;
}
