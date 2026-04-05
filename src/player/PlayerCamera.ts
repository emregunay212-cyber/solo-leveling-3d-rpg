import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CAMERA } from '../config/GameConfig';

/**
 * Metin2-style camera:
 * - Right-click tap on ground = move character there
 * - Right-click hold + drag = rotate camera
 * - Scroll = zoom
 */
export class PlayerCamera {
  public camera: ArcRotateCamera;
  private targetNode: TransformNode;
  private scene: Scene;

  // Camera settings
  private readonly ROTATION_SPEED = CAMERA.rotationSpeed;
  private readonly ZOOM_SPEED = CAMERA.zoomSpeed;
  private readonly HEIGHT_OFFSET = CAMERA.heightOffset;
  private readonly MIN_RADIUS = CAMERA.minRadius;
  private readonly MAX_RADIUS = CAMERA.maxRadius;
  private readonly MIN_BETA = CAMERA.minBeta;
  private readonly MAX_BETA = CAMERA.maxBeta;

  // Right-click state: distinguish click vs drag
  private isRightMouseDown = false;
  private rightMouseDownTime = 0;
  private rightMouseDragDist = 0;
  private rightMouseDownX = 0;
  private rightMouseDownY = 0;
  private readonly DRAG_THRESHOLD = CAMERA.dragThresholdPixels; // pixels moved before it counts as drag

  // Callback for right-click-to-move
  private onRightClickGround: ((worldPos: Vector3) => void) | null = null;

  constructor(scene: Scene, target: TransformNode) {
    this.targetNode = target;
    this.scene = scene;

    this.camera = new ArcRotateCamera(
      'playerCamera',
      CAMERA.initialAlpha,
      CAMERA.initialBeta,
      CAMERA.initialRadius,
      target.position.add(new Vector3(0, this.HEIGHT_OFFSET, 0)),
      scene
    );

    this.camera.lowerRadiusLimit = this.MIN_RADIUS;
    this.camera.upperRadiusLimit = this.MAX_RADIUS;
    this.camera.lowerBetaLimit = this.MIN_BETA;
    this.camera.upperBetaLimit = this.MAX_BETA;
    this.camera.inputs.clear();
    this.camera.detachControl();

    this.setupControls();
  }

  public setOnRightClickGround(callback: (worldPos: Vector3) => void): void {
    this.onRightClickGround = callback;
  }

  private setupControls(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas()!;

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button === 2) {
        this.isRightMouseDown = true;
        this.rightMouseDownTime = Date.now();
        this.rightMouseDragDist = 0;
        this.rightMouseDownX = e.clientX;
        this.rightMouseDownY = e.clientY;
        e.preventDefault();
      }
    });

    canvas.addEventListener('pointerup', (e: PointerEvent) => {
      if (e.button === 2) {
        // If barely dragged, it's a click -> move to that spot
        if (this.rightMouseDragDist < this.DRAG_THRESHOLD) {
          this.handleRightClick(e);
        }
        this.isRightMouseDown = false;
        e.preventDefault();
      }
    });

    canvas.addEventListener('pointerleave', () => {
      this.isRightMouseDown = false;
    });

    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.isRightMouseDown) {
        // Track total drag distance
        this.rightMouseDragDist += Math.abs(e.movementX) + Math.abs(e.movementY);

        // Only rotate camera if actually dragging
        if (this.rightMouseDragDist >= this.DRAG_THRESHOLD) {
          this.camera.alpha -= e.movementX * this.ROTATION_SPEED;
          this.camera.beta -= e.movementY * this.ROTATION_SPEED;

          if (this.camera.beta < this.MIN_BETA) this.camera.beta = this.MIN_BETA;
          if (this.camera.beta > this.MAX_BETA) this.camera.beta = this.MAX_BETA;
        }
      }
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      const delta = e.deltaY > 0 ? this.ZOOM_SPEED : -this.ZOOM_SPEED;
      this.camera.radius += delta;
      if (this.camera.radius < this.MIN_RADIUS) this.camera.radius = this.MIN_RADIUS;
      if (this.camera.radius > this.MAX_RADIUS) this.camera.radius = this.MAX_RADIUS;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });
    document.addEventListener('contextmenu', (e) => {
      if (e.target === canvas) { e.preventDefault(); e.stopPropagation(); }
    });
  }

  private handleRightClick(e: PointerEvent): void {
    // Raycast from screen point to find ground position
    const pickResult = this.scene.pick(e.clientX, e.clientY, (mesh) => {
      // Only pick ground/walkable surfaces, not enemies or UI
      return mesh.name === 'ground' || mesh.name.startsWith('obs') || mesh.name.startsWith('pil');
    });

    if (pickResult?.hit && pickResult.pickedPoint) {
      const worldPos = pickResult.pickedPoint.clone();
      if (this.onRightClickGround) {
        this.onRightClickGround(worldPos);
      }
    }
  }

  public update(): void {
    const pos = this.targetNode.position;
    this.camera.target.x = pos.x;
    this.camera.target.y = pos.y + this.HEIGHT_OFFSET;
    this.camera.target.z = pos.z;
  }

  public getForwardDirection(): Vector3 {
    const forward = this.camera.target.subtract(this.camera.position);
    forward.y = 0;
    if (forward.lengthSquared() < 0.001) return new Vector3(0, 0, 1);
    forward.normalize();
    return forward;
  }

  public getRightDirection(): Vector3 {
    const forward = this.getForwardDirection();
    return Vector3.Cross(Vector3.Up(), forward).normalize();
  }

  public getAlpha(): number {
    return this.camera.alpha;
  }

  public isRotating(): boolean {
    return this.isRightMouseDown && this.rightMouseDragDist >= this.DRAG_THRESHOLD;
  }

  public dispose(): void {
    this.camera.dispose();
  }
}
