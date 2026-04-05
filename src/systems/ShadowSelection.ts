import { Scene } from '@babylonjs/core/scene';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import type { ShadowSoldier } from '../shadows/ShadowSoldier';
import type { ShadowArmy } from '../shadows/ShadowArmy';
import type { Enemy } from '../enemies/Enemy';
import type { DamageNumbers } from '../combat/DamageNumbers';
import type { InputManager } from '../core/InputManager';

/**
 * RTS tarzi golge secme + yonlendirme sistemi.
 *
 * Ctrl basili tutarken fare surukle → kare secim alani
 * Ctrl + sol tik golgeye → tek golge sec
 * Seciliyken sag tik dusmana → secili golgeler saldirsin
 * Esc → secimi temizle
 */
export class ShadowSelection {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private shadowArmy: ShadowArmy;
  private input: InputManager;
  private damageNumbers: DamageNumbers | null = null;

  // Secim durumu
  private selectedShadows: Set<ShadowSoldier> = new Set();
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;
  private mouseWasDown = false;

  // Secim kutusu
  private selectionBox: HTMLDivElement;

  // Enemies referansi
  private enemies: Enemy[] = [];

  constructor(scene: Scene, shadowArmy: ShadowArmy, input: InputManager) {
    this.scene = scene;
    this.canvas = scene.getEngine().getRenderingCanvas()!;
    this.shadowArmy = shadowArmy;
    this.input = input;

    // Secim kutusu
    this.selectionBox = document.createElement('div');
    this.selectionBox.id = 'selection-box';
    this.selectionBox.style.cssText = `
      position: fixed;
      border: 1.5px solid rgba(168,85,247,0.8);
      background: rgba(168,85,247,0.1);
      pointer-events: none;
      z-index: 50;
      display: none;
      box-shadow: 0 0 8px rgba(168,85,247,0.3);
    `;
    document.body.appendChild(this.selectionBox);

    this.setupRightClick();
    this.setupEsc();
  }

  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  public setDamageNumbers(dn: DamageNumbers): void {
    this.damageNumbers = dn;
  }

  /**
   * Her frame cagrilir — Ctrl basili + mouse durumunu kontrol eder.
   * Babylon event sistemi yerine InputManager uzerinden calisir.
   */
  public update(): void {
    const ctrlDown = this.input.isKeyDown('ControlLeft') || this.input.isKeyDown('ControlRight');
    const mouseDown = this.input.isMouseButtonDown(0);

    if (ctrlDown && mouseDown && !this.mouseWasDown) {
      // Ctrl + sol tik basladi
      this.dragStartX = this.scene.pointerX;
      this.dragStartY = this.scene.pointerY;
      this.dragCurrentX = this.dragStartX;
      this.dragCurrentY = this.dragStartY;
      this.isDragging = false;
    }

    if (ctrlDown && mouseDown) {
      // Surukluyor
      this.dragCurrentX = this.scene.pointerX;
      this.dragCurrentY = this.scene.pointerY;

      const dx = Math.abs(this.dragCurrentX - this.dragStartX);
      const dy = Math.abs(this.dragCurrentY - this.dragStartY);

      if (dx > 5 || dy > 5) {
        this.isDragging = true;
        this.drawBox();
      }
    }

    if (ctrlDown && !mouseDown && this.mouseWasDown) {
      // Ctrl + sol tik birakildi
      if (this.isDragging) {
        this.finishBoxSelection();
      } else {
        this.handleSingleClick();
      }
      this.isDragging = false;
      this.selectionBox.style.display = 'none';
    }

    // Ctrl birakilirsa surukleyi iptal et
    if (!ctrlDown && this.isDragging) {
      this.isDragging = false;
      this.selectionBox.style.display = 'none';
    }

    this.mouseWasDown = ctrlDown && mouseDown;
  }

  private setupRightClick(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 2 || e.altKey) return;
      if (this.selectedShadows.size === 0) return;
      this.handleRightClickCommand();
    });
  }

  private setupEsc(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.clearSelection();
    });
  }

  private drawBox(): void {
    const left = Math.min(this.dragStartX, this.dragCurrentX);
    const top = Math.min(this.dragStartY, this.dragCurrentY);
    const w = Math.abs(this.dragCurrentX - this.dragStartX);
    const h = Math.abs(this.dragCurrentY - this.dragStartY);

    this.selectionBox.style.display = 'block';
    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${w}px`;
    this.selectionBox.style.height = `${h}px`;
  }

  /** 3D pozisyonu scene.pointerX/Y ile ayni koordinat sistemine cevir */
  private worldToScreen(worldPos: Vector3): { x: number; y: number } | null {
    const engine = this.scene.getEngine();
    const camera = this.scene.activeCamera;
    if (!camera) return null;

    // Babylon.js ile ayni hesaplama
    const renderW = engine.getRenderWidth(true);  // true = hardware scaling
    const renderH = engine.getRenderHeight(true);
    const vp = camera.viewport.toGlobal(renderW, renderH);

    const worldMatrix = Matrix.Identity();
    const viewProjection = this.scene.getTransformMatrix();
    const projected = Vector3.Project(worldPos, worldMatrix, viewProjection, vp);

    // Kamera arkasinda mi kontrol
    if (projected.z < 0 || projected.z > 1) return null;

    // scene.pointerX/Y de ayni koordinat sistemini kullanir
    return { x: projected.x, y: projected.y };
  }

  /** Kutu icindeki golgeleri sec */
  private finishBoxSelection(): void {
    this.clearSelection();

    const left = Math.min(this.dragStartX, this.dragCurrentX);
    const top = Math.min(this.dragStartY, this.dragCurrentY);
    const right = Math.max(this.dragStartX, this.dragCurrentX);
    const bottom = Math.max(this.dragStartY, this.dragCurrentY);

    for (const shadow of this.shadowArmy.getShadows()) {
      if (!shadow.isAlive()) continue;

      const screenPos = this.worldToScreen(shadow.mesh.position);
      if (!screenPos) continue;

      if (screenPos.x >= left && screenPos.x <= right &&
          screenPos.y >= top && screenPos.y <= bottom) {
        this.selectedShadows.add(shadow);
      }
    }

    this.updateVisuals();
  }

  /** Tek tik — golgeyi sec */
  private handleSingleClick(): void {
    const pickResult = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (mesh) => mesh.name.startsWith('shadow_'),
    );

    if (pickResult?.hit && pickResult.pickedMesh) {
      const shadow = this.shadowArmy.getShadows().find(
        s => s.mesh === pickResult.pickedMesh && s.isAlive(),
      );

      if (shadow) {
        this.clearSelection();
        this.selectedShadows.add(shadow);
        this.updateVisuals();
      }
    }
  }

  /** Sag tik → secili golgeleri hedefe yonlendir */
  private handleRightClickCommand(): void {
    const pickResult = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (mesh) => this.enemies.some(en => en.mesh === mesh && en.isAlive()),
    );

    if (!pickResult?.hit || !pickResult.pickedMesh) return;

    const target = this.enemies.find(
      en => en.mesh === pickResult.pickedMesh && en.isAlive(),
    );
    if (!target) return;

    for (const shadow of this.selectedShadows) {
      if (shadow.isAlive()) shadow.forceTarget(target);
    }

    if (this.damageNumbers) {
      this.damageNumbers.spawn(
        target.mesh.position.add(new Vector3(0, 2.2, 0)), 0, 'skill',
      );
    }

    this.clearSelection();
  }

  private updateVisuals(): void {
    for (const shadow of this.shadowArmy.getShadows()) {
      shadow.setSelected(this.selectedShadows.has(shadow));
    }
  }

  public clearSelection(): void {
    for (const shadow of this.selectedShadows) {
      if (shadow.isAlive()) shadow.setSelected(false);
    }
    this.selectedShadows.clear();
  }

  public dispose(): void {
    this.selectionBox.remove();
    this.clearSelection();
  }
}
