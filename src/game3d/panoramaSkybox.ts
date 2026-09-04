/**
 * Procedural 360-Degree Mountain Panorama & Landscape Generator
 * Generates an authentic 360-degree mountain valley panorama (inspired by Google Earth
 * satellite / terrain views of rugged mountain passes) and realistic terrain textures.
 */
import * as THREE from 'three';

/**
 * Creates a high-definition 360 panorama canvas texture representing
 * a photorealistic mountain valley under a blue sky with cumulus clouds.
 */
export function create360PanoramaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Sky Gradient (from zenith deep sky blue down to horizon haze)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  skyGrad.addColorStop(0.0, '#3a7bd5'); // Deep mountain blue
  skyGrad.addColorStop(0.35, '#6fa1db'); // Radiant azure
  skyGrad.addColorStop(0.65, '#a7c6e6'); // Pale atmospheric blue
  skyGrad.addColorStop(1.0, '#dbe7f2'); // Bright horizon glow
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.55);

  // 2. Realistic Fluffy Cumulus Clouds across the 360 sky
  const drawCloud = (cx: number, cy: number, scaleX: number, scaleY: number, alpha: number) => {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.filter = 'blur(4px)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, scaleX, scaleY, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - scaleX * 0.45, cy + scaleY * 0.1, scaleX * 0.7, scaleY * 0.7, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + scaleX * 0.45, cy + scaleY * 0.15, scaleX * 0.65, scaleY * 0.65, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + scaleX * 0.15, cy - scaleY * 0.25, scaleX * 0.6, scaleY * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  for (let c = 0; c < 18; c++) {
    const cx = (c / 18) * width + (Math.sin(c * 99) * 40);
    const cy = height * 0.18 + Math.sin(c * 3.7) * 90;
    const sx = 90 + (c % 5) * 22;
    const sy = 34 + (c % 3) * 12;
    drawCloud(cx, cy, sx, sy, 0.72);
  }

  // 3. Layer 1: Distant Towering Blue-Grey Mountain Peaks (Far Horizon)
  ctx.fillStyle = '#899bb0';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.52);
  for (let x = 0; x <= width; x += 10) {
    const t = (x / width) * Math.PI * 8;
    const peakY = height * 0.38 +
      Math.sin(t) * 48 +
      Math.sin(t * 2.3) * 28 +
      Math.cos(t * 4.7) * 15;
    ctx.lineTo(x, peakY);
  }
  ctx.lineTo(width, height * 0.55);
  ctx.lineTo(0, height * 0.55);
  ctx.closePath();
  ctx.fill();

  // Distant snow/limestone highlight on far peaks
  ctx.fillStyle = 'rgba(235, 243, 252, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.48);
  for (let x = 0; x <= width; x += 15) {
    const t = (x / width) * Math.PI * 8;
    const peakY = height * 0.38 +
      Math.sin(t) * 48 +
      Math.sin(t * 2.3) * 28 +
      Math.cos(t * 4.7) * 15;
    ctx.lineTo(x, peakY + 6);
  }
  ctx.lineTo(width, height * 0.46);
  ctx.lineTo(0, height * 0.46);
  ctx.closePath();
  ctx.fill();

  // 4. Layer 2: Mid-distance Rugged Rocky Mountain Range (Ochre / Brown / Slate)
  const mountainGrad = ctx.createLinearGradient(0, height * 0.35, 0, height * 0.6);
  mountainGrad.addColorStop(0.0, '#786d5e'); // Sun-warmed rock
  mountainGrad.addColorStop(0.5, '#635b4f'); // Mountain shadow
  mountainGrad.addColorStop(1.0, '#535c47'); // Lower olive vegetation
  ctx.fillStyle = mountainGrad;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.58);
  for (let x = 0; x <= width; x += 8) {
    const t = (x / width) * Math.PI * 12;
    const midY = height * 0.44 +
      Math.sin(t) * 36 +
      Math.cos(t * 1.8) * 22 +
      Math.sin(t * 3.4) * 12;
    ctx.lineTo(x, midY);
  }
  ctx.lineTo(width, height * 0.65);
  ctx.lineTo(0, height * 0.65);
  ctx.closePath();
  ctx.fill();

  // Mountain Rock Strata / Crevices
  ctx.strokeStyle = 'rgba(45, 40, 34, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const sx = (i / 60) * width + Math.sin(i * 12) * 20;
    const sy = height * 0.46 + Math.cos(i * 3.1) * 25;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (i % 2 === 0 ? 18 : -18), sy + 35);
    ctx.stroke();
  }

  // 5. Layer 3: Rolling Green & Earth Foothills (Directly matching Beach Head screenshots)
  const foothillGrad = ctx.createLinearGradient(0, height * 0.5, 0, height * 0.85);
  foothillGrad.addColorStop(0.0, '#66734c'); // Olive green ridge
  foothillGrad.addColorStop(0.4, '#55693c'); // Rich grassy green
  foothillGrad.addColorStop(0.8, '#787352'); // Earthy dry knoll
  foothillGrad.addColorStop(1.0, '#4b5735'); // Deep pasture green
  ctx.fillStyle = foothillGrad;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  for (let x = 0; x <= width; x += 6) {
    const t = (x / width) * Math.PI * 6;
    const hillY = height * 0.56 +
      Math.sin(t) * 25 +
      Math.sin(t * 2.5) * 15 +
      Math.cos(t * 5.1) * 8;
    ctx.lineTo(x, hillY);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Shrub / foliage speckles on foothills
  ctx.fillStyle = 'rgba(34, 46, 24, 0.4)';
  for (let s = 0; s < 250; s++) {
    const bx = Math.random() * width;
    const by = height * 0.62 + Math.random() * (height * 0.35);
    const rad = 2 + Math.random() * 5;
    ctx.beginPath();
    ctx.arc(bx, by, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates the 360-degree panorama skydome enclosing the game world.
 */
export function create360PanoramaDome(): THREE.Mesh {
  const texture = create360PanoramaTexture();
  // Inverted sphere for panoramic 360 view
  const domeGeo = new THREE.SphereGeometry(600, 32, 24);
  const domeMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
  });

  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.name = 'panorama_360_dome';
  dome.position.set(0, 40, 0);
  return dome;
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
