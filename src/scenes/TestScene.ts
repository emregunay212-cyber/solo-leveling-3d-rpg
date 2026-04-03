import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { Scene } from '@babylonjs/core/scene';
import type { GameScene } from '../core/SceneManager';
import type { Game } from '../Game';
import { PlayerCamera } from '../player/PlayerCamera';
import { PlayerController } from '../player/PlayerController';
import { PlayerCombat } from '../player/PlayerCombat';
import { CombatSystem } from '../combat/CombatSystem';
import { DamageNumbers } from '../combat/DamageNumbers';
import { HUD } from '../ui/HUD';
import { ClickIndicator } from '../ui/ClickIndicator';
import { Enemy } from '../enemies/Enemy';
import { LevelSystem } from '../progression/LevelSystem';
import { ENEMY_DEFS } from '../data/enemies';
import { DeathScreen } from '../ui/DeathScreen';
import { StatsUI } from '../ui/StatsUI';

export class TestScene implements GameScene {
  public name = 'test';
  private game: Game;
  private meshes: Mesh[] = [];
  private aggregates: PhysicsAggregate[] = [];
  private enemies: Enemy[] = [];
  private clickIndicator!: ClickIndicator;
  private levelSystem!: LevelSystem;
  private deathScreen!: DeathScreen;
  private statsUI!: StatsUI;

  // Player state
  private playerHp = 100;
  private playerMaxHp = 100;
  private playerAlive = true;
  private gold = 0;
  private lastDeathPos = Vector3.Zero();

  // Respawn
  private respawnTimers: { enemy: Enemy; timer: number; pos: Vector3 }[] = [];

  constructor(game: Game) {
    this.game = game;
  }

  async onLoad(): Promise<void> {
    const scene = this.game.engine.scene;
    scene.collisionsEnabled = true;

    // Ground
    const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100, subdivisions: 20 }, scene);
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new Color3(0.15, 0.15, 0.2);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.1);
    ground.material = groundMat;
    this.meshes.push(ground);
    this.aggregates.push(new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene));

    this.createGrid(scene);
    this.createObstacles(scene);

    // Player
    this.game.player = new PlayerController(scene, this.game.input, null);
    this.game.playerCamera = new PlayerCamera(scene, this.game.player.root);
    this.game.player.setCamera(this.game.playerCamera);
    scene.activeCamera = this.game.playerCamera.camera;

    // Combat
    this.game.combatSystem = new CombatSystem(scene);
    this.game.damageNumbers = new DamageNumbers(scene);
    this.game.playerCombat = new PlayerCombat(scene, this.game.input, this.game.player, this.game.combatSystem, this.game.damageNumbers);

    // Level system
    this.levelSystem = new LevelSystem();
    this.levelSystem.setOnLevelUp((level) => {
      console.log(`LEVEL UP! Now level ${level}`);
      this.applyStats();
      this.playerHp = this.playerMaxHp; // Full heal on level up
    });
    this.levelSystem.setOnXpGain((amount) => {
      this.game.hud.showXpGain(amount);
    });

    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = this.playerMaxHp;
    this.game.playerCombat.setBaseDamage(this.levelSystem.getAttackDamage());

    // HUD
    this.game.hud = new HUD();
    this.updateHUD();

    // Death screen
    this.deathScreen = new DeathScreen();
    this.deathScreen.setOnRespawnHere(() => this.respawnPlayer(this.lastDeathPos));
    this.deathScreen.setOnRespawnStart(() => this.respawnPlayer(Vector3.Zero()));

    // Stats panel (P to open)
    this.statsUI = new StatsUI(this.levelSystem);
    this.statsUI.setOnStatChanged(() => this.applyStats());

    // Click indicator
    this.clickIndicator = new ClickIndicator(scene);

    // Right-click to move
    this.game.playerCamera.setOnRightClickGround((worldPos) => {
      this.game.player.setAutoMoveTarget(worldPos);
      this.game.playerCombat.cancelAutoAttack();
      this.clickIndicator.spawn(worldPos);
    });

    // Spawn enemies
    this.spawnEnemies(scene);
  }

  private spawnEnemies(scene: Scene): void {
    // Goblin group (close, easy)
    const goblinPositions = [
      new Vector3(6, 0, 6), new Vector3(8, 0, 4), new Vector3(5, 0, 9),
    ];
    for (const pos of goblinPositions) {
      this.createEnemy(scene, pos, 'goblin');
    }

    // Wolf group
    const wolfPositions = [
      new Vector3(-8, 0, 8), new Vector3(-10, 0, 6), new Vector3(-7, 0, 11),
    ];
    for (const pos of wolfPositions) {
      this.createEnemy(scene, pos, 'wolf');
    }

    // Orc group (further, harder)
    const orcPositions = [
      new Vector3(15, 0, 15), new Vector3(18, 0, 13),
    ];
    for (const pos of orcPositions) {
      this.createEnemy(scene, pos, 'orc');
    }

    // Skeletons
    const skelPositions = [
      new Vector3(-15, 0, -10), new Vector3(-13, 0, -13), new Vector3(-17, 0, -8),
    ];
    for (const pos of skelPositions) {
      this.createEnemy(scene, pos, 'skeleton');
    }

    // Dark Knight (strong)
    this.createEnemy(scene, new Vector3(0, 0, 25), 'darkKnight');

    // Demon (very strong)
    this.createEnemy(scene, new Vector3(-20, 0, 20), 'demon');
  }

  private createEnemy(scene: Scene, pos: Vector3, type: string): void {
    const def = ENEMY_DEFS[type];
    if (!def) return;

    const enemy = new Enemy(scene, pos, def);
    this.game.combatSystem.registerTarget(enemy);

    // On enemy death: give XP and gold
    enemy.setOnDeath((e) => {
      this.levelSystem.addXp(e.def.xpReward);
      this.gold += e.def.goldReward;
      this.updateHUD();

      // Schedule respawn after 15 seconds
      this.respawnTimers.push({ enemy: e, timer: 15, pos: pos.clone() });
    });

    // On enemy attacks player
    enemy.setOnAttackPlayer((damage) => {
      if (!this.playerAlive) return;
      this.playerHp = Math.max(0, this.playerHp - damage);
      this.game.damageNumbers.spawn(
        this.game.player.getPosition().add(new Vector3(0, 1.5, 0)),
        damage,
        'player_hurt'
      );
      this.updateHUD();

      // Player death
      if (this.playerHp <= 0 && this.playerAlive) {
        this.playerAlive = false;
        this.lastDeathPos = this.game.player.getPosition().clone();
        this.levelSystem.applyDeathPenalty();
        this.deathScreen.show();
      }
    });

    this.enemies.push(enemy);
  }

  private updateHUD(): void {
    this.game.hud.setHP(this.playerHp, this.playerMaxHp);
    this.game.hud.setMP(this.levelSystem.getMaxMp(), this.levelSystem.getMaxMp());
    this.game.hud.setXP(this.levelSystem.getXpPercent());
    this.game.hud.setLevel(this.levelSystem.level);
    this.game.hud.setGold(this.gold);
  }

  private createGrid(scene: Scene): void {
    const lineMat = new StandardMaterial('gridMat', scene);
    lineMat.diffuseColor = new Color3(0.2, 0.2, 0.25);
    lineMat.alpha = 0.3;
    for (let i = -40; i <= 40; i += 10) {
      const lx = MeshBuilder.CreateBox(`gx${i}`, { width: 80, height: 0.02, depth: 0.05 }, scene);
      lx.position.set(0, 0.01, i);
      lx.material = lineMat;
      this.meshes.push(lx);
      const lz = MeshBuilder.CreateBox(`gz${i}`, { width: 0.05, height: 0.02, depth: 80 }, scene);
      lz.position.set(i, 0.01, 0);
      lz.material = lineMat;
      this.meshes.push(lz);
    }
  }

  private createObstacles(scene: Scene): void {
    const mat1 = new StandardMaterial('obsMat', scene);
    mat1.diffuseColor = new Color3(0.3, 0.15, 0.5);

    [[12, 1, 12], [-15, 2, 5], [20, 1.5, -10]].forEach(([x, h, z], i) => {
      const box = MeshBuilder.CreateBox(`obs${i}`, { width: 2, height: h, depth: 2 }, scene);
      box.position.set(x, h / 2, z);
      box.material = mat1;
      this.meshes.push(box);
      this.aggregates.push(new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 0 }, scene));
    });

    // Portal ring
    const torus = MeshBuilder.CreateTorus('portal', { diameter: 3, thickness: 0.15, tessellation: 32 }, scene);
    torus.position.set(0, 1.5, 35);
    const pMat = new StandardMaterial('portalMat', scene);
    pMat.diffuseColor = new Color3(0.4, 0.2, 0.8);
    pMat.emissiveColor = new Color3(0.3, 0.1, 0.6);
    torus.material = pMat;
    this.meshes.push(torus);
  }

  onEnter(): void {}

  onUpdate(dt: number): void {
    const playerPos = this.game.player.getPosition();

    this.game.player.update(dt);
    this.game.playerCombat.update(dt);
    this.game.damageNumbers.update(dt);
    this.clickIndicator.update(dt);

    // Update enemies
    for (const enemy of this.enemies) {
      enemy.update(dt, playerPos, this.playerAlive);
    }

    // Respawn timers
    for (let i = this.respawnTimers.length - 1; i >= 0; i--) {
      this.respawnTimers[i].timer -= dt;
      if (this.respawnTimers[i].timer <= 0) {
        const { enemy, pos } = this.respawnTimers[i];
        enemy.respawn(pos);
        this.respawnTimers.splice(i, 1);
      }
    }

    // Combo indicator
    const combo = this.game.playerCombat.getComboSystem();
    if (combo.getIsAttacking() && this.game.playerCombat.getLastHitCount() > 0) {
      this.game.hud.showCombo(combo.getComboIndex());
    }

    // Portal rotation
    const portal = this.game.engine.scene.getMeshByName('portal');
    if (portal) {
      portal.rotation.y += dt * 0.5;
      portal.rotation.x = Math.sin(Date.now() / 1000) * 0.1;
    }

    // Update HUD periodically
    this.updateHUD();
  }

  private applyStats(): void {
    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
    this.game.playerCombat.setBaseDamage(this.levelSystem.getAttackDamage());
    this.game.playerCombat.getComboSystem().setAttackSpeed(this.levelSystem.getAttackSpeed());
    this.updateHUD();
  }

  private respawnPlayer(pos: Vector3): void {
    this.playerAlive = true;
    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = this.playerMaxHp;
    this.game.player.mesh.position.set(pos.x, pos.y + 0.9, pos.z);
    this.game.player.characterController.setPosition(new Vector3(pos.x, pos.y + 0.9, pos.z));
    this.game.playerCombat.cancelAutoAttack();
    this.updateHUD();
  }

  onExit(): void {}

  onDispose(): void {
    this.meshes.forEach(m => m.dispose());
    this.aggregates.forEach(a => a.dispose());
    this.enemies.forEach(e => e.dispose());
    this.game.hud?.dispose();
    this.game.damageNumbers?.dispose();
    this.clickIndicator?.dispose();
    this.deathScreen?.dispose();
    this.statsUI?.dispose();
  }
}
