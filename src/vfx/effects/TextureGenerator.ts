/**
 * Prosedural texture uretici.
 * Tum VFX texture'lari Canvas2D ile runtime'da uretilir — harici dosya gerektirmez.
 */

import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { Scene } from '@babylonjs/core/scene';

const CACHE = new Map<string, DynamicTexture>();

function getOrCreate(scene: Scene, key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void): DynamicTexture {
  const cached = CACHE.get(key);
  if (cached) return cached;

  const tex = new DynamicTexture(`tex_${key}`, size, scene, false);
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
  draw(ctx, size);
  tex.update();
  tex.hasAlpha = true;
  CACHE.set(key, tex);
  return tex;
}

/** Yumusak isik noktasi — particle temel sprite */
export function createFlareTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'flare', 64, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.7, 'rgba(200,180,255,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Duman/sis sprite */
export function createSmokeTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'smoke', 128, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.9);
    g.addColorStop(0, 'rgba(180,180,200,0.8)');
    g.addColorStop(0.4, 'rgba(140,140,160,0.4)');
    g.addColorStop(0.7, 'rgba(100,100,120,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    // Noise benzeri lekeler
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 5 + Math.random() * 15;
      const ng = ctx.createRadialGradient(x, y, 0, x, y, r);
      ng.addColorStop(0, 'rgba(200,200,220,0.3)');
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Kivilcim sprite — kucuk parlak nokta */
export function createSparkTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'spark', 32, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,220,180,0.8)');
    g.addColorStop(1, 'rgba(255,100,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Kilic ark izi */
export function createSlashArcTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'slash_arc', 256, (ctx, s) => {
    const h = s / 4;
    ctx.clearRect(0, 0, s, s);
    // Yatay gradient ark
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.5, 'rgba(200,150,255,1)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    // Ince yatay bant
    const y0 = s / 2 - h / 2;
    ctx.fillRect(0, y0, s, h);
    // Dikey fade
    const vg = ctx.createLinearGradient(0, y0, 0, y0 + h);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.3, 'rgba(255,255,255,0.3)');
    vg.addColorStop(0.5, 'rgba(255,255,255,1)');
    vg.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'source-over';
  });
}

/** Buyu cemberi */
export function createMagicCircleTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'magic_circle', 512, (ctx, s) => {
    const c = s / 2;
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(180,100,255,0.9)';
    ctx.lineWidth = 2;

    // Dis halka
    ctx.beginPath();
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    // Ic halka
    ctx.beginPath();
    ctx.arc(c, c, c * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Rune cizgileri (6 kol yildiz)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = c + Math.cos(angle) * c * 0.7;
      const y1 = c + Math.sin(angle) * c * 0.7;
      const x2 = c + Math.cos(angle + Math.PI / 6) * c * 0.9;
      const y2 = c + Math.sin(angle + Math.PI / 6) * c * 0.9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Ic ucgen
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const x = c + Math.cos(angle) * c * 0.55;
      const y = c + Math.sin(angle) * c * 0.55;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Radial fade
    const rg = ctx.createRadialGradient(c, c, c * 0.5, c, c, c);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = rg;
    // Disi biraz sil
    const outerFade = ctx.createRadialGradient(c, c, c * 0.85, c, c, c);
    outerFade.addColorStop(0, 'rgba(0,0,0,0)');
    outerFade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = outerFade;
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'source-over';
  });
}

/** Shockwave halka sprite */
export function createRingTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'ring', 256, (ctx, s) => {
    const c = s / 2;
    ctx.clearRect(0, 0, s, s);
    const g = ctx.createRadialGradient(c, c, c * 0.7, c, c, c * 0.95);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.3, 'rgba(200,150,255,0.8)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(0.7, 'rgba(200,150,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Ates sprite */
export function createFireTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'fire', 128, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c * 1.2, 0, c, c * 0.8, c * 0.7);
    g.addColorStop(0, 'rgba(255,255,200,1)');
    g.addColorStop(0.2, 'rgba(255,200,50,0.9)');
    g.addColorStop(0.5, 'rgba(255,100,0,0.6)');
    g.addColorStop(0.8, 'rgba(200,0,0,0.2)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Buz kristal sprite */
export function createIceTexture(scene: Scene): DynamicTexture {
  return getOrCreate(scene, 'ice', 64, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(200,240,255,1)');
    g.addColorStop(0.4, 'rgba(130,200,255,0.7)');
    g.addColorStop(0.8, 'rgba(80,150,220,0.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Tum cache'i temizle */
export function disposeTextureCache(): void {
  for (const tex of CACHE.values()) {
    tex.dispose();
  }
  CACHE.clear();
}
