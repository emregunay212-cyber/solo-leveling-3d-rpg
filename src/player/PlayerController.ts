import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Ray } from '@babylonjs/core/Culling/ray';
import {
  PhysicsCharacterController,
} from '@babylonjs/core/Physics/v2/characterController';
import { InputManager } from '../core/InputManager';
import { PlayerCamera } from './PlayerCamera';
import { PLAYER } from '../config/GameConfig';

/**
 * Metin2-style character controller:
 * - WASD movement, Shift sprint, C block/parry
 * - No jumping (Space is for attack)
 * - Havok for horizontal collision
 * - Raycast for ground snapping
 */
export class PlayerController {
  public root: TransformNode;
  public mesh: Mesh;
  public characterController: PhysicsCharacterController;

  private input: InputManager;
  private camera!: PlayerCamera;
  private scene: Scene;

  // Tuning (from GameConfig)
  private readonly WALK_SPEED = PLAYER.walkSpeed;
  private readonly SPRINT_SPEED = PLAYER.sprintSpeed;
  private readonly PLAYER_HEIGHT = PLAYER.height;
  private readonly PLAYER_RADIUS = PLAYER.radius;
  private readonly ROTATION_LERP = PLAYER.rotationLerp;
  private readonly BLOCK_SPEED_MULTIPLIER = PLAYER.blockSpeedMultiplier;

  // Reusable
  private readonly zeroGravity = new Vector3(0, 0, 0);
  private readonly downVec = new Vector3(0, -1, 0);

  // State
  private currentSpeed = 0;
  private targetRotationY = 0;

  // Block
  private isBlockingState = false;
  private mat!: StandardMaterial;

  constructor(scene: Scene, input: InputManager, camera: PlayerCamera | null) {
    this.scene = scene;
    this.input = input;
    if (camera) this.camera = camera;

    this.root = new TransformNode('playerRoot', scene);
    this.mesh = this.createTempMesh();

    const capsuleH = this.PLAYER_HEIGHT - this.PLAYER_RADIUS * 2;
    const centerY = this.PLAYER_RADIUS + capsuleH / 2;
    const startPos = new Vector3(0, centerY, 0);

    this.characterController = new PhysicsCharacterController(
      startPos,
      { capsuleHeight: capsuleH, capsuleRadius: this.PLAYER_RADIUS },
      scene
    );

    this.mesh.position.copyFrom(startPos);
  }

  private createTempMesh(): Mesh {
    const body = MeshBuilder.CreateCapsule('playerBody', {
      height: this.PLAYER_HEIGHT, radius: 0.3,
    }, this.scene);
    const mat = new StandardMaterial('playerMat', this.scene);
    mat.diffuseColor = new Color3(0.2, 0.15, 0.4);
    mat.specularColor = new Color3(0.3, 0.2, 0.5);
    body.material = mat;
    this.mat = mat;
    return body;
  }

  public update(dt: number): void {
    if (dt <= 0) dt = 1 / 60;

    // Dash override — skill Q sirasinda normal hareket devre disi
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
      this.applyPhysics(dt, this.dashDirection, this.dashSpeed);
      this.root.position.copyFrom(this.mesh.position);
      this.camera.update();
      return;
    }

    this.updateBlockState();
    const { moveDir, speed } = this.calculateMovement();
    this.currentSpeed = speed;
    this.applyPhysics(dt, moveDir, speed);
    this.updateRotation();
    this.root.position.copyFrom(this.mesh.position);
    this.camera.update();
  }

  private updateBlockState(): void {
    const wasBlocking = this.isBlockingState;
    this.isBlockingState = this.input.isBlocking();

    if (this.isBlockingState && !wasBlocking) {
      this.mat.emissiveColor = new Color3(0.1, 0.2, 0.5);
    } else if (!this.isBlockingState && wasBlocking) {
      this.mat.emissiveColor = Color3.Black();
    }
  }

  private calculateMovement(): { moveDir: Vector3; speed: number } {
    const moveInput = this.input.getMovementVector();
    const hasManualInput = moveInput.x !== 0 || moveInput.z !== 0;
    let moveDir = Vector3.Zero();
    let speed = 0;

    if (hasManualInput) {
      this.autoMoveTarget = null;
      const forward = this.camera.getForwardDirection();
      const right = this.camera.getRightDirection();
      moveDir = forward.scale(moveInput.z).add(right.scale(moveInput.x)).normalize();
      this.targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      speed = this.input.isSprinting() ? this.SPRINT_SPEED : this.WALK_SPEED;
    } else if (this.autoMoveTarget) {
      const toTarget = this.autoMoveTarget.subtract(this.mesh.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist > 0.5) {
        moveDir = toTarget.normalize();
        this.targetRotationY = Math.atan2(moveDir.x, moveDir.z);
        speed = this.autoMoveSpeed;
      } else {
        this.autoMoveTarget = null;
      }
    }

    if (this.isBlockingState) {
      speed *= this.BLOCK_SPEED_MULTIPLIER;
    }

    return { moveDir, speed };
  }

  private applyPhysics(dt: number, moveDir: Vector3, speed: number): void {
    const velocity = new Vector3(moveDir.x * speed, 0, moveDir.z * speed);

    const support = this.characterController.checkSupport(dt, this.downVec);
    this.characterController.setVelocity(velocity);
    this.characterController.integrate(dt, support, this.zeroGravity);

    const newPos = this.characterController.getPosition();
    const floorY = this.getFloorY(newPos);
    if (floorY !== null) {
      newPos.y = floorY + this.PLAYER_HEIGHT / 2;
    }
    if (newPos.y < this.PLAYER_HEIGHT / 2) {
      newPos.y = this.PLAYER_HEIGHT / 2;
    }

    this.characterController.setPosition(newPos);
    this.mesh.position.copyFrom(newPos);
  }

  // ─── Ground raycast ───
  private getFloorY(pos: Vector3): number | null {
    const feetY = pos.y - this.PLAYER_HEIGHT / 2 + 0.05;
    const origin = new Vector3(pos.x, feetY, pos.z);
    const ray = new Ray(origin, Vector3.Down(), 50);
    const hit = this.scene.pickWithRay(ray, (m) => {
      return m !== this.mesh && m.isPickable && m.isEnabled();
    });
    if (hit?.hit && hit.pickedPoint) {
      if (hit.getNormal) {
        const normal = hit.getNormal(true);
        if (normal && normal.y < 0.7) return null;
      }
      return hit.pickedPoint.y;
    }
    return null;
  }

  // ─── Rotation ───
  private updateRotation(): void {
    if (this.currentSpeed > 0) {
      let diff = this.targetRotationY - this.mesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.mesh.rotation.y += diff * this.ROTATION_LERP;
    }
  }

  // ─── Auto-move toward a target position ───
  private autoMoveTarget: Vector3 | null = null;
  private autoMoveSpeed = 0;

  public setAutoMoveTarget(target: Vector3 | null, speed?: number): void {
    this.autoMoveTarget = target;
    this.autoMoveSpeed = speed ?? this.WALK_SPEED;
  }

  public getAutoMoveTarget(): Vector3 | null { return this.autoMoveTarget; }

  public getPosition(): Vector3 { return this.mesh.position; }
  public isMoving(): boolean { return this.currentSpeed > 0 || this.autoMoveTarget !== null; }
  public getIsBlocking(): boolean { return this.isBlockingState; }
  public getIsGrounded(): boolean { return true; }
  public getCurrentSpeed(): number { return this.currentSpeed; }
  public setCamera(camera: PlayerCamera): void { this.camera = camera; }

  // ─── Skill: Dash ───
  private isDashing = false;
  private dashTimer = 0;
  private dashDirection = Vector3.Zero();
  private dashSpeed = 0;

  /** Skill Q icin: baktigi yone hizla atil */
  public dashTo(distance: number, duration: number): void {
    const rotY = this.mesh.rotation.y;
    this.dashDirection = new Vector3(Math.sin(rotY), 0, Math.cos(rotY));
    this.dashSpeed = distance / Math.max(0.01, duration);
    this.dashTimer = duration;
    this.isDashing = true;
    this.autoMoveTarget = null;
  }

  public getIsDashing(): boolean { return this.isDashing; }

  public getForwardDirection(): Vector3 {
    const rotY = this.mesh.rotation.y;
    return new Vector3(Math.sin(rotY), 0, Math.cos(rotY));
  }

  public dispose(): void {
    this.mesh.dispose();
    this.characterController.dispose();
    this.root.dispose();
  }
}
