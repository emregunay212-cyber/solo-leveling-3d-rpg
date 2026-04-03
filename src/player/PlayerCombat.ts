import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { InputManager } from '../core/InputManager';
import { CombatSystem, Damageable } from '../combat/CombatSystem';
import { ComboSystem } from '../combat/ComboSystem';
import { DamageNumbers } from '../combat/DamageNumbers';
import { PlayerController } from './PlayerController';

export class PlayerCombat {
  private input: InputManager;
  private combatSystem: CombatSystem;
  private comboSystem: ComboSystem;
  private damageNumbers: DamageNumbers;
  private player: PlayerController;
  private scene: Scene;

  private baseDamage = 25;
  private mouseWasDown = false;
  private lastHitCount = 0;

  // Auto-attack (Metin2 style: double-click enemy -> walk to + auto attack)
  private autoAttackTarget: Damageable | null = null;
  private readonly AUTO_ATTACK_RANGE = 3.5;

  // Double-click detection
  private lastClickTime = 0;
  private readonly DOUBLE_CLICK_TIME = 0.4; // seconds

  constructor(
    scene: Scene,
    input: InputManager,
    player: PlayerController,
    combatSystem: CombatSystem,
    damageNumbers: DamageNumbers
  ) {
    this.scene = scene;
    this.input = input;
    this.player = player;
    this.combatSystem = combatSystem;
    this.damageNumbers = damageNumbers;
    this.comboSystem = new ComboSystem();

    this.setupDoubleClick();
  }

  private setupDoubleClick(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas()!;
    canvas.addEventListener('dblclick', (e) => {
      if (e.button === 0) { // Left double-click
        this.trySelectTarget();
      }
    });
  }

  private trySelectTarget(): void {
    // Raycast from camera through mouse to find an enemy
    const pickResult = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (mesh) => {
        // Check if this mesh belongs to a registered target
        return this.combatSystem.getTargets().some(
          t => t.mesh === mesh && t.isAlive()
        );
      }
    );

    if (pickResult?.hit && pickResult.pickedMesh) {
      // Find the damageable target for this mesh
      const target = this.combatSystem.getTargets().find(
        t => t.mesh === pickResult.pickedMesh && t.isAlive()
      );
      if (target) {
        this.autoAttackTarget = target;
      }
    }
  }

  public update(dt: number): void {
    this.comboSystem.update(dt);

    // ─── Auto-attack logic ───
    if (this.autoAttackTarget) {
      if (!this.autoAttackTarget.isAlive()) {
        // Target died, stop
        this.autoAttackTarget = null;
        this.player.setAutoMoveTarget(null);
      } else {
        const playerPos = this.player.getPosition();
        const targetPos = this.autoAttackTarget.mesh.position;
        const toTarget = targetPos.subtract(playerPos);
        toTarget.y = 0;
        const dist = toTarget.length();

        if (dist > this.AUTO_ATTACK_RANGE) {
          // Walk toward enemy
          this.player.setAutoMoveTarget(targetPos.clone());
        } else {
          // In range - stop moving and attack
          this.player.setAutoMoveTarget(null);

          // Face the target
          const dir = toTarget.normalize();
          this.player.mesh.rotation.y = Math.atan2(dir.x, dir.z);

          // Auto-attack
          this.tryAttack();
        }
      }
    }

    // ─── Manual Space attack ───
    const spaceDown = this.input.isAttacking();
    if (spaceDown) {
      this.tryAttack();
    }

    // ─── Manual left click attack ───
    const mouseDown = this.input.isMouseButtonDown(0);
    if (mouseDown && !this.mouseWasDown) {
      this.tryAttack();
    }
    this.mouseWasDown = mouseDown;

    // ─── Cancel auto-attack with manual movement ───
    const moveInput = this.input.getMovementVector();
    if (moveInput.x !== 0 || moveInput.z !== 0) {
      this.autoAttackTarget = null;
    }
  }

  private tryAttack(): void {
    const combo = this.comboSystem.tryAttack();
    if (!combo) return;

    const rotation = this.player.mesh.rotation.y;
    const attackDir = new Vector3(Math.sin(rotation), 0, Math.cos(rotation));
    const attackerPos = this.player.getPosition();
    const damage = this.baseDamage * combo.damageMultiplier;

    const hits = this.combatSystem.meleeAttack(attackerPos, attackDir, damage);
    this.lastHitCount = hits.length;

    for (const hit of hits) {
      const numPos = hit.target.mesh.position.clone();
      numPos.y += 1.5;
      this.damageNumbers.spawn(
        numPos,
        hit.damage,
        hit.isCritical ? 'critical' : 'normal'
      );
    }

    if (hits.length === 0) {
      this.comboSystem.resetCombo();
    }
  }

  public getAutoAttackTarget(): Damageable | null { return this.autoAttackTarget; }
  public cancelAutoAttack(): void { this.autoAttackTarget = null; }
  public getComboSystem(): ComboSystem { return this.comboSystem; }
  public getLastHitCount(): number { return this.lastHitCount; }
  public getBaseDamage(): number { return this.baseDamage; }
  public setBaseDamage(dmg: number): void { this.baseDamage = dmg; }
}
