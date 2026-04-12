import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { InputManager } from '../core/InputManager';
import { CombatSystem, Damageable } from '../combat/CombatSystem';
import { ComboSystem } from '../combat/ComboSystem';
import { DamageNumbers } from '../combat/DamageNumbers';
import { PlayerController } from './PlayerController';
import { COMBAT } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';

export class PlayerCombat {
  private input: InputManager;
  private combatSystem: CombatSystem;
  private comboSystem: ComboSystem;
  private damageNumbers: DamageNumbers;
  private player: PlayerController;
  private scene: Scene;

  private baseDamage = COMBAT.basePlayerDamage;
  private mouseWasDown = false;
  private lastHitCount = 0;

  // Auto-attack (Metin2 style: double-click enemy -> walk to + auto attack)
  private autoAttackTarget: Damageable | null = null;
  private readonly AUTO_ATTACK_RANGE = COMBAT.autoAttackRange;

  // Auto-attack toggle (T tusu)
  private autoAttackMode = false;
  private autoAttackKeyWasDown = false;
  private readonly AUTO_ATTACK_SEARCH_RADIUS: number = COMBAT.autoAttackSearchRadius;

  // Double-click detection
  private lastClickTime = 0;
  private readonly DOUBLE_CLICK_TIME = COMBAT.doubleClickTime; // seconds

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

    // ─── Auto-attack toggle (T tusu) ───
    const tKeyDown = this.input.isKeyDown('KeyT');
    if (tKeyDown && !this.autoAttackKeyWasDown) {
      this.autoAttackMode = !this.autoAttackMode;
      eventBus.emit('autoAttack:toggle', { enabled: this.autoAttackMode });
      if (!this.autoAttackMode) {
        this.autoAttackTarget = null;
        this.player.setAutoMoveTarget(null);
      }
    }
    this.autoAttackKeyWasDown = tKeyDown;

    // ─── Auto-attack mode: en yakin dusmani bul ───
    if (this.autoAttackMode) {
      // Hedef oldu veya yok → yeni hedef ara
      if (!this.autoAttackTarget || !this.autoAttackTarget.isAlive()) {
        this.autoAttackTarget = null;
        this.findNearestEnemy();
      }
    }

    // ─── Auto-attack logic ───
    if (this.autoAttackTarget) {
      if (!this.autoAttackTarget.isAlive()) {
        // Target died — auto-attack modundaysa yeni hedef ara
        this.autoAttackTarget = null;
        this.player.setAutoMoveTarget(null);
        if (this.autoAttackMode) {
          this.findNearestEnemy();
        }
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
      if (this.autoAttackMode) {
        this.autoAttackMode = false;
        eventBus.emit('autoAttack:toggle', { enabled: false });
      }
      this.autoAttackTarget = null;
    }
  }

  /** 8 birim icindeki en yakin canli dusmani bul ve hedef olarak set et */
  private findNearestEnemy(): void {
    const playerPos = this.player.getPosition();
    let nearest: Damageable | null = null;
    let nearestDist = this.AUTO_ATTACK_SEARCH_RADIUS;

    for (const target of this.combatSystem.getTargets()) {
      if (!target.isAlive()) continue;
      const toTarget = target.mesh.position.subtract(playerPos);
      toTarget.y = 0;
      const dist = toTarget.length();
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = target;
      }
    }

    if (nearest) {
      this.autoAttackTarget = nearest;
    }
  }

  private tryAttack(): void {
    const combo = this.comboSystem.tryAttack();
    if (!combo) return;

    // Play attack animation
    this.player.animator.playAttack(combo.comboIndex, this.comboSystem.getAttackSpeed());

    const rotation = this.player.mesh.rotation.y;
    const attackDir = new Vector3(Math.sin(rotation), 0, Math.cos(rotation));
    const attackerPos = this.player.getPosition();
    const damage = this.baseDamage * combo.damageMultiplier;

    // 4. vuruş (comboIndex === 3): 360° AoE finisher
    const stepDef = this.comboSystem.COMBO_STEPS[combo.comboIndex];
    const aoeRadius = stepDef?.aoeRadius ?? 0;

    const hits = aoeRadius > 0
      ? this.combatSystem.aoeAttack(attackerPos, aoeRadius, damage)
      : this.combatSystem.meleeAttack(attackerPos, attackDir, damage);
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

  public isAutoAttackModeEnabled(): boolean { return this.autoAttackMode; }
  public getAutoAttackTarget(): Damageable | null { return this.autoAttackTarget; }
  public cancelAutoAttack(): void { this.autoAttackTarget = null; }
  public getComboSystem(): ComboSystem { return this.comboSystem; }
  public getLastHitCount(): number { return this.lastHitCount; }
  public getBaseDamage(): number { return this.baseDamage; }
  public setBaseDamage(dmg: number): void { (this as unknown as { baseDamage: number }).baseDamage = dmg; }
}
