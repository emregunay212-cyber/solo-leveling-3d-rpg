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
  CharacterSupportedState,
} from '@babylonjs/core/Physics/v2/characterController';
import { InputManager } from '../core/InputManager';
import { PlayerCamera } from './PlayerCamera';

/**
 * Metin2-style character controller:
 * - WASD movement, Shift sprint, C dodge
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

  // Tuning
  private readonly WALK_SPEED = 5;
  private readonly SPRINT_SPEED = 9;
  private readonly PLAYER_HEIGHT = 1.8;
  private readonly PLAYER_RADIUS = 0.35;
  private readonly ROTATION_LERP = 0.15;
  private readonly DODGE_SPEED = 15;
  private readonly DODGE_DURATION = 0.3;
  private readonly DODGE_COOLDOWN = 1.0;

  // Reusable
  private readonly zeroGravity = new Vector3(0, 0, 0);
  private readonly downVec = new Vector3(0, -1, 0);

  // State
  private currentSpeed = 0;
  private targetRotationY = 0;

  // Dodge
  private isDodging = false;
  private dodgeTimer = 0;
  private dodgeCooldownTimer = 0;
  private dodgeDirection = Vector3.Zero();

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
    return body;
  }

  public update(dt: number): void {
    if (dt <= 0) dt = 1 / 60;
    this.updateDodge(dt);

    // ─── Horizontal input ───
    const moveInput = this.input.getMovementVector();
    const hasManualInput = moveInput.x !== 0 || moveInput.z !== 0;
    let moveDir = Vector3.Zero();
    let speed = 0;

    // Manual input cancels auto-move
    if (hasManualInput) {
      this.autoMoveTarget = null;
    }

    if (hasManualInput && !this.isDodging) {
      const forward = this.camera.getForwardDirection();
      const right = this.camera.getRightDirection();
      moveDir = forward.scale(moveInput.z).add(right.scale(moveInput.x)).normalize();
      this.targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      speed = this.input.isSprinting() ? this.SPRINT_SPEED : this.WALK_SPEED;
    } else if (this.autoMoveTarget && !this.isDodging) {
      // Auto-move toward target
      const toTarget = this.autoMoveTarget.subtract(this.mesh.position);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist > 0.5) {
        moveDir = toTarget.normalize();
        this.targetRotationY = Math.atan2(moveDir.x, moveDir.z);
        speed = this.autoMoveSpeed;
      } else {
        // Reached target
        this.autoMoveTarget = null;
      }
    }

    this.currentSpeed = speed;

    // ─── Build horizontal velocity ───
    const velocity = new Vector3(0, 0, 0);
    if (this.isDodging) {
      velocity.x = this.dodgeDirection.x * this.DODGE_SPEED;
      velocity.z = this.dodgeDirection.z * this.DODGE_SPEED;
    } else {
      velocity.x = moveDir.x * speed;
      velocity.z = moveDir.z * speed;
    }

    // ─── Havok: horizontal collision ───
    const support = this.characterController.checkSupport(dt, this.downVec);
    this.characterController.setVelocity(velocity);
    this.characterController.integrate(dt, support, this.zeroGravity);

    // ─── Get position, snap to ground ───
    const newPos = this.characterController.getPosition();
    const floorY = this.getFloorY(newPos);
    if (floorY !== null) {
      newPos.y = floorY + this.PLAYER_HEIGHT / 2;
    }

    // Safety floor
    if (newPos.y < this.PLAYER_HEIGHT / 2) {
      newPos.y = this.PLAYER_HEIGHT / 2;
    }

    // Apply position
    this.characterController.setPosition(newPos);
    this.mesh.position.copyFrom(newPos);

    // ─── Rotation ───
    this.updateRotation();
    this.root.position.copyFrom(this.mesh.position);
    this.camera.update();

    // ─── Dodge trigger ───
    if (hasManualInput && this.input.isKeyDown('KeyC') && this.dodgeCooldownTimer <= 0) {
      this.startDodge(moveDir);
    }
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

  // ─── Dodge ───
  private startDodge(direction: Vector3): void {
    this.isDodging = true;
    this.dodgeTimer = this.DODGE_DURATION;
    this.dodgeCooldownTimer = this.DODGE_COOLDOWN;
    this.dodgeDirection = direction.clone();
  }

  private updateDodge(dt: number): void {
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= dt;
    if (!this.isDodging) return;
    this.dodgeTimer -= dt;
    if (this.dodgeTimer <= 0) this.isDodging = false;
  }

  // ─── Rotation ───
  private updateRotation(): void {
    if (this.currentSpeed > 0 || this.isDodging) {
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
  public getIsDodging(): boolean { return this.isDodging; }
  public getIsGrounded(): boolean { return true; }
  public getCurrentSpeed(): number { return this.currentSpeed; }
  public setCamera(camera: PlayerCamera): void { this.camera = camera; }
}
