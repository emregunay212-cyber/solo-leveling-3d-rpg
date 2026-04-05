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
import { DamageCalculator } from '../combat/DamageCalculator';
import { HUD } from '../ui/HUD';
import { ClickIndicator } from '../ui/ClickIndicator';
import { Enemy } from '../enemies/Enemy';
import { LevelSystem } from '../progression/LevelSystem';
import { RespawnManager } from '../systems/RespawnManager';
import { ENEMY_DEFS } from '../data/enemies';
import { SCENE } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';
import { createGameContext } from '../core/GameContext';
import { DeathScreen } from '../ui/DeathScreen';
import { StatsUI } from '../ui/StatsUI';
import { SkillSystem } from '../skills/SkillSystem';
import { SkillEffects } from '../skills/SkillEffects';
import { SkillBar } from '../ui/SkillBar';
import { ShadowArmy } from '../shadows/ShadowArmy';
import { ShadowSelection } from '../systems/ShadowSelection';
import { ShadowUI } from '../ui/ShadowUI';
import { ShadowProfileManager } from '../shadows/ShadowProfileManager';
import { ShadowInventory } from '../systems/ShadowInventory';
import { DropSystem } from '../systems/DropSystem';
import { ShadowManageUI } from '../ui/ShadowManageUI';
import { SKILLS, MP, SHADOW } from '../config/GameConfig';
import { initDevConsole, disposeDevConsole } from '../systems/DevConsole';

export class TestScene implements GameScene {
  public name = 'test';
  private game: Game;
  private meshes: Mesh[] = [];
  private aggregates: PhysicsAggregate[] = [];
  private enemies: Enemy[] = [];

  // Systems
  private clickIndicator!: ClickIndicator;
  private levelSystem!: LevelSystem;
  private deathScreen!: DeathScreen;
  private statsUI!: StatsUI;
  private respawnManager!: RespawnManager;
  private damageCalculator!: DamageCalculator;
  private skillSystem!: SkillSystem;
  private skillEffects!: SkillEffects;
  private skillBar!: SkillBar;
  private shadowArmy!: ShadowArmy;
  private shadowSelection!: ShadowSelection;
  private shadowUI!: ShadowUI;
  private shadowProfileManager!: ShadowProfileManager;
  private shadowInventory!: ShadowInventory;
  private dropSystem!: DropSystem;
  private shadowManageUI!: ShadowManageUI;

  // Player state
  private playerHp = 100;
  private playerMaxHp = 100;
  private playerMp = 55;
  private playerMaxMp = 55;
  private playerAlive = true;
  private gold = 0;
  private lastDeathPos = Vector3.Zero();
  private mpRegenAccum = 0;
  private shadowDrainAccum = 0;

  constructor(game: Game) {
    this.game = game;
  }

  async onLoad(): Promise<void> {
    const scene = this.game.engine.scene;
    scene.collisionsEnabled = true;

    this.createEnvironment(scene);
    this.initPlayer(scene);
    this.initCombat(scene);
    this.initProgression();
    this.initUI(scene);
    this.spawnEnemies(scene);
    this.shadowSelection.setEnemies(this.enemies);
  }

  // ─── INITIALIZATION (split from onLoad) ───

  private createEnvironment(scene: Scene): void {
    // Ground
    const ground = MeshBuilder.CreateGround('ground', {
      width: SCENE.groundSize, height: SCENE.groundSize,
      subdivisions: SCENE.groundSubdivisions,
    }, scene);
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new Color3(0.15, 0.15, 0.2);
    groundMat.specularColor = new Color3(0.05, 0.05, 0.1);
    ground.material = groundMat;
    this.meshes.push(ground);
    this.aggregates.push(new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene));

    this.createGrid(scene);
    this.createObstacles(scene);
  }

  private initPlayer(scene: Scene): void {
    this.game.player = new PlayerController(scene, this.game.input, null);
    this.game.playerCamera = new PlayerCamera(scene, this.game.player.root);
    this.game.player.setCamera(this.game.playerCamera);
    scene.activeCamera = this.game.playerCamera.camera;
  }

  private initCombat(scene: Scene): void {
    this.game.combatSystem = new CombatSystem(scene);
    this.game.damageNumbers = new DamageNumbers(scene);
    this.game.playerCombat = new PlayerCombat(
      scene, this.game.input, this.game.player,
      this.game.combatSystem, this.game.damageNumbers,
    );
  }

  private initProgression(): void {
    this.levelSystem = new LevelSystem();
    this.levelSystem.setOnLevelUp(() => {
      this.applyStats();
      this.playerHp = this.playerMaxHp;
    });
    this.levelSystem.setOnXpGain((amount) => {
      this.game.hud.showXpGain(amount);
    });

    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = this.playerMaxHp;
    this.playerMaxMp = this.levelSystem.getMaxMp();
    this.playerMp = this.playerMaxMp;
    this.game.playerCombat.setBaseDamage(this.levelSystem.getAttackDamage());

    this.respawnManager = new RespawnManager();
    this.damageCalculator = new DamageCalculator(this.levelSystem, this.game.damageNumbers);
    // Shield buff baglantisi — initProgression'da skillSystem henuz yok, sonra baglanacak

    // Skill system
    this.skillEffects = new SkillEffects(this.game.engine.scene);
    this.skillSystem = new SkillSystem(this.game.input);
    this.skillSystem.setOnCast((result) => {
      this.handleSkillCast(result.skill.id, result.damage);
    });

    // Shield buff → DamageCalculator baglantisi
    this.damageCalculator.setShieldReductionGetter(() => this.skillSystem.getShieldReduction());

    // Shadow profile & inventory systems
    this.shadowProfileManager = new ShadowProfileManager();
    this.shadowInventory = new ShadowInventory();
    this.dropSystem = new DropSystem(this.shadowInventory);

    // Shadow army + selection (pass profileManager)
    this.shadowArmy = new ShadowArmy(this.game.engine.scene, this.shadowProfileManager);
    this.shadowArmy.setDamageNumbers(this.game.damageNumbers);
    this.shadowSelection = new ShadowSelection(this.game.engine.scene, this.shadowArmy, this.game.input);
    this.shadowSelection.setDamageNumbers(this.game.damageNumbers);
  }

  private initUI(scene: Scene): void {
    this.game.hud = new HUD();
    this.updateHUD();

    this.deathScreen = new DeathScreen();
    this.deathScreen.setOnRespawnHere(() => this.respawnPlayer(this.lastDeathPos));
    this.deathScreen.setOnRespawnStart(() => this.respawnPlayer(Vector3.Zero()));

    this.statsUI = new StatsUI(this.levelSystem);
    this.statsUI.setOnStatChanged(() => this.applyStats());

    this.clickIndicator = new ClickIndicator(scene);

    this.skillBar = new SkillBar();
    this.skillBar.initSlots(this.skillSystem.getSlots());

    this.shadowUI = new ShadowUI();
    this.shadowManageUI = new ShadowManageUI(
      this.shadowProfileManager,
      this.shadowInventory,
      (name: string) => ENEMY_DEFS[name] ?? null,
    );

    // Tab key toggles shadow manage UI
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.shadowManageUI.toggle();
      }
    });

    // Soul slot click opens manage UI with that slot's shadow selected
    this.shadowUI.setOnSlotClick((slotIndex: number) => {
      const slots = this.shadowArmy.getSoulSlots();
      const slot = slots[slotIndex];
      if (slot && slot.profiles.length > 0) {
        this.shadowManageUI.selectShadow(slot.profiles[0].uid);
        this.shadowManageUI.open();
      }
    });

    this.setupShadowControls(scene);
    this.setupSoulStockControls(scene);

    // Dev console — kaldirmak icin bu satiri ve import'u sil
    initDevConsole({
      levelSystem: this.levelSystem,
      player: this.game.player,
      combat: this.game.playerCombat,
      getEnemies: () => this.enemies,
      getHp: () => this.playerHp,
      getMp: () => this.playerMp,
      setHp: (v) => { this.playerHp = v; },
      setMp: (v) => { this.playerMp = v; },
    });

    this.game.playerCamera.setOnRightClickGround((worldPos) => {
      this.game.player.setAutoMoveTarget(worldPos);
      this.game.playerCombat.cancelAutoAttack();
      this.clickIndicator.spawn(worldPos);
    });
  }

  // ─── ENEMY SPAWNING ───

  private spawnEnemies(scene: Scene): void {
    for (const [type, positions] of Object.entries(SCENE.spawns)) {
      for (const s of positions) {
        this.createEnemy(scene, new Vector3(s.x, 0, s.z), type);
      }
    }
  }

  private createEnemy(scene: Scene, pos: Vector3, type: string): void {
    const def = ENEMY_DEFS[type];
    if (!def) return;

    const enemy = new Enemy(scene, pos, def);
    this.game.combatSystem.registerTarget(enemy);

    enemy.setOnDeath((e) => {
      this.levelSystem.addXp(e.def.xpReward);
      this.gold += e.def.goldReward;

      // Drop system: roll item drops and add gold to inventory
      this.dropSystem.rollDrops(type, e.def.level);
      this.dropSystem.addGold(e.def.goldReward);

      this.updateHUD();
      this.respawnManager.schedule(e, pos);
    });

    enemy.setOnAttackPlayer((rawDamage, isBackstab) => {
      this.handleEnemyAttack(enemy, rawDamage, isBackstab);
    });

    // Dusman golge askerine saldirdiginda en yakin golgeye hasar ver
    enemy.setOnAttackThreat((damage, threatPos) => {
      const shadows = this.shadowArmy.getShadows();
      let nearest: { shadow: typeof shadows[number]; dist: number } | null = null;
      for (const s of shadows) {
        if (!s.isAlive()) continue;
        const dist = s.position.subtract(threatPos).length();
        if (dist < SHADOW.threatSearchRange && (!nearest || dist < nearest.dist)) {
          nearest = { shadow: s, dist };
        }
      }
      if (nearest) {
        nearest.shadow.takeDamage(damage);
        this.game.damageNumbers.spawn(
          nearest.shadow.mesh.position.add(new Vector3(0, 1.5, 0)),
          damage, 'player_hurt',
        );
      }
    });

    this.enemies.push(enemy);
  }

  // ─── DAMAGE HANDLING (delegated to DamageCalculator) ───

  private handleEnemyAttack(enemy: Enemy, rawDamage: number, isBackstab: boolean): void {
    if (!this.playerAlive) return;

    const result = this.damageCalculator.calculateIncomingDamage(rawDamage, isBackstab, {
      playerPos: this.game.player.getPosition(),
      playerRotY: this.game.player.mesh.rotation.y,
      playerIsBlocking: this.game.player.getIsBlocking(),
      playerIsAttacking: this.game.playerCombat.getComboSystem().getIsAttacking(),
      enemyMeshPos: enemy.mesh.position,
    });

    if (result.type !== 'parry') {
      this.playerHp = Math.max(0, this.playerHp - result.damage);
    }

    eventBus.emit('player:damage', { amount: result.damage, type: result.type });
    this.updateHUD();

    if (this.playerHp <= 0 && this.playerAlive) {
      this.playerAlive = false;
      this.lastDeathPos = this.game.player.getPosition().clone();
      this.shadowArmy.killAllShadows(); // Oyuncu olunce golgeler de yok olur
      this.levelSystem.applyDeathPenalty();
      this.deathScreen.show();
      eventBus.emit('player:death', { position: this.lastDeathPos });
    }
  }

  // ─── RUH STOK KONTROLLERI ───

  private stockKeyStates = [false, false, false, false];
  private readonly STOCK_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

  /**
   * 1/2/3/4 basili tut + golgeye sol tik → stokla
   * Alt + 1/2/3/4 → stoktan cagir
   */
  private setupSoulStockControls(scene: Scene): void {
    const canvas = scene.getEngine().getRenderingCanvas()!;

    // 1-4 basili tutarken golgeye tiklama → stokla
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.altKey) return;

      // Hangi stok tusu basili?
      let slotIndex = -1;
      for (let i = 0; i < 4; i++) {
        if (this.game.input.isKeyDown(this.STOCK_KEYS[i])) {
          slotIndex = i;
          break;
        }
      }
      if (slotIndex === -1) return;

      // Golge mesh'ine tiklanmis mi?
      const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
        return mesh.name.startsWith('shadow_');
      });

      if (!pickResult?.hit || !pickResult.pickedMesh) return;

      const shadow = this.shadowArmy.getShadows().find(
        s => s.mesh === pickResult.pickedMesh && s.isAlive(),
      );

      if (!shadow) return;

      const success = this.shadowArmy.stockShadow(slotIndex, shadow);
      if (success) {
        this.game.damageNumbers.spawn(
          shadow.mesh.position.add(new Vector3(0, 1.5, 0)),
          0, 'skill',
        );
      }
    });
  }

  /** Alt + 1/2/3/4 kontrol (onUpdate icinden cagrilir) */
  private updateSoulSummon(): void {
    const altDown = this.game.input.isKeyDown('AltLeft') || this.game.input.isKeyDown('AltRight');
    if (!altDown) {
      this.stockKeyStates = [false, false, false, false];
      return;
    }

    for (let i = 0; i < 4; i++) {
      const isDown = this.game.input.isKeyDown(this.STOCK_KEYS[i]);
      if (isDown && !this.stockKeyStates[i]) {
        // Alt + sayi tusu → stoktan cagir
        const playerPos = this.game.player.getPosition().clone();
        // Oyuncunun biraz arkasinda spawn et
        const offset = this.game.player.getForwardDirection().scale(-SHADOW.summonOffsetDistance);
        const spawnPos = playerPos.add(offset);
        spawnPos.y = 0;

        const success = this.shadowArmy.summonFromStock(
          i, spawnPos, this.levelSystem.level,
        );
        if (success) {
          this.game.damageNumbers.spawn(
            spawnPos.add(new Vector3(0, 2, 0)),
            0, 'arise',
          );
        }
      }
      this.stockKeyStates[i] = isDown;
    }
  }

  // ─── GAME LOOP ───

  onEnter(): void {}

  onUpdate(dt: number): void {
    this.game.player.update(dt);
    this.game.playerCombat.update(dt);
    this.game.damageNumbers.update(dt);
    this.clickIndicator.update(dt);
    this.skillEffects.update(dt);

    // Create centralized game context for all systems
    const ctx = createGameContext(
      dt,
      this.game.player.getPosition(),
      this.game.player.mesh.rotation.y,
      this.playerAlive,
      this.game.player.getIsBlocking(),
      this.game.playerCombat.getComboSystem().getIsAttacking(),
      this.playerHp,
      this.playerMaxHp,
    );

    for (const enemy of this.enemies) {
      enemy.update(ctx);
    }

    this.respawnManager.update(dt);

    // Skill system update
    if (this.playerAlive) {
      const castResult = this.skillSystem.update(
        dt, this.playerMp, this.levelSystem.str, this.levelSystem.int,
      );
      if (castResult) {
        this.playerMp = Math.max(0, this.playerMp - castResult.skill.mpCost);
      }
    }

    // MP regen
    this.updateMpRegen(dt);

    // Skill bar UI update
    this.skillBar.update(this.skillSystem.getSlots(), this.playerMp);

    // Shadow army + selection update
    this.shadowArmy.update(ctx, this.enemies);
    this.shadowSelection.update();
    this.updateSoulSummon();
    this.shadowUI.setExtractMode(this.game.input.isKeyDown('AltLeft') || this.game.input.isKeyDown('AltRight'));
    this.shadowUI.updateCount(
      this.shadowArmy.getAliveCount(),
      this.shadowArmy.getManaDrainPerSecond(this.levelSystem.level),
      this.levelSystem.getMpRegen(),
    );
    this.shadowUI.updateSoulSlots(this.shadowArmy.getSoulSlots());

    this.updateComboIndicator();
    this.updatePortal(dt);

    this.game.hud.setBlocking(ctx.player.isBlocking);
    this.updateHUD();
  }

  private updateComboIndicator(): void {
    const combo = this.game.playerCombat.getComboSystem();
    if (combo.getIsAttacking() && this.game.playerCombat.getLastHitCount() > 0) {
      this.game.hud.showCombo(combo.getComboIndex());
    }
  }

  private updatePortal(dt: number): void {
    const portal = this.game.engine.scene.getMeshByName('portal');
    if (portal) {
      portal.rotation.y += dt * SCENE.portalRotationSpeed;
      portal.rotation.x = Math.sin(Date.now() / 1000) * SCENE.portalBobAmplitude;
    }
  }

  // ─── SHADOW EXTRACTION ───

  /**
   * Alt modifier ile tum golge kontrolleri:
   * Alt + sol tik olu cesede → golge cikarma
   * Alt + sol tik canli dusmana → golgeleri hedefe yonlendir
   * Alt + sag tik golgeye → golgeyi yok et
   */
  private setupShadowControls(scene: Scene): void {
    const canvas = scene.getEngine().getRenderingCanvas()!;

    canvas.addEventListener('pointerdown', (e) => {
      if (!e.altKey) return;
      e.preventDefault();

      if (e.button === 0) {
        this.handleAltLeftClick(scene);
      } else if (e.button === 2) {
        this.handleAltRightClick(scene);
      }
    });
  }

  /** Alt + sol tik: olu cesede → cikar, canli dusmana → golgeleri yonlendir */
  private handleAltLeftClick(scene: Scene): void {
    // Once olu cesede cikarma dene
    const extractPick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
      return mesh.name.startsWith('enemy_');
    });

    if (extractPick?.hit && extractPick.pickedMesh) {
      const deadEnemy = this.enemies.find(
        e => e.mesh === extractPick.pickedMesh && e.isExtractable(),
      );

      if (deadEnemy) {
        this.tryExtractShadow(deadEnemy);
        return;
      }

      // Canli dusman ise → golgeleri yonlendir
      const aliveEnemy = this.enemies.find(
        e => e.mesh === extractPick.pickedMesh && e.isAlive(),
      );

      if (aliveEnemy && this.shadowArmy.getAliveCount() > 0) {
        this.shadowArmy.commandAllToAttack(aliveEnemy);
        this.game.damageNumbers.spawn(
          aliveEnemy.mesh.position.add(new Vector3(0, 2.2, 0)),
          0, 'skill',
        );
      }
    }
  }

  /** Alt + sag tik: golgeyi yok et */
  private handleAltRightClick(scene: Scene): void {
    if (this.shadowArmy.getAliveCount() === 0) return;

    const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
      return mesh.name.startsWith('shadow_');
    });

    if (!pickResult?.hit || !pickResult.pickedMesh) return;

    const shadow = this.shadowArmy.getShadows().find(
      s => s.mesh === pickResult.pickedMesh && s.isAlive(),
    );

    if (shadow) {
      this.game.damageNumbers.spawn(
        shadow.mesh.position.add(new Vector3(0, 1.5, 0)),
        0, 'extract_fail',
      );
      shadow.takeDamage(999999);
    }
  }

  private tryExtractShadow(enemy: Enemy): void {
    const pos = enemy.mesh.position.clone();
    pos.y = 0;

    const success = this.shadowArmy.tryExtract(
      enemy.def, pos,
      this.levelSystem.level,
      this.levelSystem.int,
    );

    if (success) {
      enemy.markExtracted();
      this.game.damageNumbers.spawn(pos.add(new Vector3(0, 2, 0)), 0, 'arise');
    } else {
      this.game.damageNumbers.spawn(pos.add(new Vector3(0, 2, 0)), 0, 'extract_fail');
      enemy.markExtracted();
    }
  }

  // ─── SKILL EFFECTS ───

  /** Yaricap icindeki dusmanlara skill hasari uygula */
  private applyAoeDamage(
    center: Vector3, range: number, damage: number,
    onHit?: (enemy: Enemy) => void,
  ): number {
    let hitCount = 0;
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const toEnemy = enemy.mesh.position.subtract(center);
      toEnemy.y = 0;
      if (toEnemy.length() > range) continue;
      enemy.takeDamage(damage, false, center);
      this.game.damageNumbers.spawn(
        enemy.mesh.position.add(new Vector3(0, 1.5, 0)), damage, 'skill',
      );
      if (onHit) onHit(enemy);
      hitCount++;
    }
    return hitCount;
  }

  private handleSkillCast(skillId: string, damage: number): void {
    const playerPos = this.game.player.getPosition();

    switch (skillId) {
      case 'shadowBlade': {
        const dir = this.game.player.getForwardDirection();
        this.skillEffects.spawnDashTrail(playerPos.clone(), dir, SKILLS.shadowBlade.range);
        this.game.player.dashTo(SKILLS.shadowBlade.range, SKILLS.shadowBlade.duration);
        // Koni icindeki dusmanlara hasar (60 derece)
        for (const enemy of this.enemies) {
          if (!enemy.isAlive()) continue;
          const toEnemy = enemy.mesh.position.subtract(playerPos);
          toEnemy.y = 0;
          if (toEnemy.length() > SKILLS.shadowBlade.range) continue;
          if (Vector3.Dot(dir, toEnemy.normalize()) < 0.5) continue;
          enemy.takeDamage(damage, false, playerPos);
          this.game.damageNumbers.spawn(
            enemy.mesh.position.add(new Vector3(0, 1.5, 0)), damage, 'skill',
          );
        }
        break;
      }
      case 'shadowShield':
        this.skillEffects.spawnShieldSphere(
          () => this.game.player.getPosition(), SKILLS.shadowShield.duration,
        );
        break;
      case 'shadowBurst':
        this.skillEffects.spawnBurstRing(playerPos.clone(), SKILLS.shadowBurst.range);
        this.applyAoeDamage(playerPos, SKILLS.shadowBurst.range, damage);
        break;
      case 'sovereignAura':
        this.skillEffects.spawnAuraWave(playerPos.clone(), SKILLS.sovereignAura.range);
        this.applyAoeDamage(playerPos, SKILLS.sovereignAura.range, damage, (enemy) => {
          enemy.applySlow(SKILLS.sovereignAura.slowMultiplier, SKILLS.sovereignAura.slowDuration);
        });
        break;
    }
    eventBus.emit('skill:hit', { skillId, damage, targetCount: this.enemies.filter(e => e.isAlive()).length });
  }

  private updateMpRegen(dt: number): void {
    if (!this.playerAlive) return;

    // MP regen (INT bazli)
    this.mpRegenAccum += dt;
    if (this.mpRegenAccum >= MP.regenInterval) {
      this.mpRegenAccum -= MP.regenInterval;
      const regen = this.levelSystem.getMpRegen();
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + regen);
    }

    // Golge mana drain — seviye bazli dinamik maliyet
    const aliveCount = this.shadowArmy.getAliveCount();
    if (aliveCount > 0) {
      this.shadowDrainAccum += dt;
      if (this.shadowDrainAccum >= SHADOW.manaDrainInterval) {
        this.shadowDrainAccum -= SHADOW.manaDrainInterval;
        // Guclu golgeler cok, zayif golgeler az MP harcar
        const drain = this.shadowArmy.getManaDrainPerSecond(this.levelSystem.level);
        this.playerMp -= drain;

        // MP bittiyse → HP kaybi
        if (this.playerMp < 0) {
          this.playerMp = 0;
          const hpDrain = aliveCount * SHADOW.hpDrainPerSecond;
          this.playerHp = Math.max(0, this.playerHp - hpDrain);
          this.updateHUD();

          if (this.playerHp <= 0 && this.playerAlive) {
            this.playerAlive = false;
            this.lastDeathPos = this.game.player.getPosition().clone();
            this.shadowArmy.killAllShadows();
            this.levelSystem.applyDeathPenalty();
            this.deathScreen.show();
            eventBus.emit('player:death', { position: this.lastDeathPos });
          }
        }
      }
    }

    // Stok iyilesme — envanterdeki golgeler zamanla iyilesir
    this.shadowArmy.updateStockHealing(dt);
  }

  // ─── HELPERS ───

  private updateHUD(): void {
    this.game.hud.setHP(this.playerHp, this.playerMaxHp);
    this.game.hud.setMP(this.playerMp, this.playerMaxMp);
    this.game.hud.setXP(this.levelSystem.getXpPercent());
    this.game.hud.setLevel(this.levelSystem.level);
    this.game.hud.setGold(this.gold);
  }

  private applyStats(): void {
    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
    this.playerMaxMp = this.levelSystem.getMaxMp();
    this.playerMp = Math.min(this.playerMp, this.playerMaxMp);
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
    this.playerMp = this.playerMaxMp; // Full MP on respawn
    this.updateHUD();
    eventBus.emit('player:respawn', { position: pos });
  }

  // ─── SCENE DECORATION ───

  private createGrid(scene: Scene): void {
    const lineMat = new StandardMaterial('gridMat', scene);
    lineMat.diffuseColor = new Color3(0.2, 0.2, 0.25);
    lineMat.alpha = 0.3;
    for (let i = -SCENE.gridRange; i <= SCENE.gridRange; i += SCENE.gridSpacing) {
      const lx = MeshBuilder.CreateBox(`gx${i}`, { width: SCENE.gridRange * 2, height: 0.02, depth: 0.05 }, scene);
      lx.position.set(0, 0.01, i);
      lx.material = lineMat;
      this.meshes.push(lx);
      const lz = MeshBuilder.CreateBox(`gz${i}`, { width: 0.05, height: 0.02, depth: SCENE.gridRange * 2 }, scene);
      lz.position.set(i, 0.01, 0);
      lz.material = lineMat;
      this.meshes.push(lz);
    }
  }

  private createObstacles(scene: Scene): void {
    const mat1 = new StandardMaterial('obsMat', scene);
    mat1.diffuseColor = new Color3(0.3, 0.15, 0.5);

    SCENE.obstacles.forEach((obs, i) => {
      const h = obs.height;
      const box = MeshBuilder.CreateBox(`obs${i}`, { width: 2, height: h, depth: 2 }, scene);
      box.position.set(obs.x, h / 2, obs.z);
      box.material = mat1;
      this.meshes.push(box);
      this.aggregates.push(new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 0 }, scene));
    });

    const torus = MeshBuilder.CreateTorus('portal', { diameter: 3, thickness: 0.15, tessellation: 32 }, scene);
    torus.position.set(0, 1.5, 35);
    const pMat = new StandardMaterial('portalMat', scene);
    pMat.diffuseColor = new Color3(0.4, 0.2, 0.8);
    pMat.emissiveColor = new Color3(0.3, 0.1, 0.6);
    torus.material = pMat;
    this.meshes.push(torus);
  }

  onExit(): void {}

  onDispose(): void {
    this.meshes.forEach(m => m.dispose());
    this.aggregates.forEach(a => a.dispose());
    this.enemies.forEach(e => e.dispose());
    this.game.player?.dispose();
    this.game.playerCamera?.dispose();
    this.game.hud?.dispose();
    this.game.damageNumbers?.dispose();
    this.game.input?.dispose();
    this.clickIndicator?.dispose();
    this.deathScreen?.dispose();
    this.statsUI?.dispose();
    this.respawnManager?.clear();
    this.skillBar?.dispose();
    this.skillEffects?.dispose();
    this.shadowArmy?.dispose();
    this.shadowSelection?.dispose();
    this.shadowUI?.dispose();
    this.shadowManageUI?.dispose();
    disposeDevConsole();
  }
}
