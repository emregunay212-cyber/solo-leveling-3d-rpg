/**
 * Dungeon sahnesi.
 * Kapali arena, dalga-bazli dusmanlar, boss savasi, portal cikislari.
 * TestScene yapisini temel alir ama respawn yok, arena sinirli, boss mekanigi var.
 */

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
import { DUNGEON, SCENE, SHADOW, SKILLS, MP, SKILL_CHARGE, PARRY_CONFIG } from '../config/GameConfig';
import { DUNGEON_RANK_DEFS } from '../dungeon/DungeonDefs';
import { ENEMY_DEFS } from '../data/enemies';
import { DUNGEON_BOSS_DEFS } from '../data/dungeonBosses';
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
import { DungeonManager } from '../dungeon/DungeonManager';
import { ShadowStockPicker } from '../ui/ShadowStockPicker';
import { ShadowManageUI } from '../ui/ShadowManageUI';
import { initDevConsole, disposeDevConsole } from '../systems/DevConsole';
import type { DungeonRank } from '../dungeon/types';
import type { PlayerStats } from '../shadows/ShadowEnhancementTypes';
import { BOSS_SKILL_DEFS } from '../data/shadowSkillBooks';
import { SafeZone, SafeZoneRegistry, createSafeZoneMesh } from '../systems/SafeZone';
import { SkillVFXManager } from '../vfx/SkillVFXManager';
import { ComboChainSystem } from '../skills/ComboChainSystem';
import { ParrySystem } from '../skills/ParrySystem';
import { TargetingSystem } from '../skills/TargetingSystem';
import { ComboUI } from '../ui/ComboUI';
import { TargetingUI } from '../ui/TargetingUI';
import { AriseUI } from '../ui/AriseUI';
import type { ChargeLevel } from '../skills/ChargeSystem';
import type { SkillCastResult } from '../skills/SkillSystem';
import { playParryVFX } from '../vfx/skills/ParryVFX';
import { playAriseVFX } from '../vfx/skills/AriseVFX';

/** Arena duvar kalinligi */
const WALL_THICKNESS = 2;
const WALL_HEIGHT = 6;

/** Rank bazli arena zemin renkleri */
const ARENA_COLORS: Record<DungeonRank, { ground: Color3; wall: Color3 }> = {
  E: { ground: new Color3(0.12, 0.14, 0.10), wall: new Color3(0.15, 0.18, 0.12) },
  D: { ground: new Color3(0.10, 0.12, 0.16), wall: new Color3(0.12, 0.14, 0.20) },
  C: { ground: new Color3(0.14, 0.10, 0.18), wall: new Color3(0.18, 0.12, 0.22) },
  B: { ground: new Color3(0.16, 0.12, 0.08), wall: new Color3(0.20, 0.15, 0.10) },
  A: { ground: new Color3(0.18, 0.08, 0.08), wall: new Color3(0.22, 0.10, 0.10) },
  S: { ground: new Color3(0.10, 0.05, 0.12), wall: new Color3(0.14, 0.06, 0.16) },
};

export class DungeonScene implements GameScene {
  public name = 'dungeon';
  private game: Game;
  private dungeonManager!: DungeonManager;
  private rank: DungeonRank = 'E';

  // Scene objects
  private meshes: Mesh[] = [];
  private aggregates: PhysicsAggregate[] = [];
  private enemies: Enemy[] = [];
  private exitPortal!: Mesh;
  private victoryPortal: Mesh | null = null;

  // Player state
  private playerHp = 100;
  private playerMaxHp = 100;
  private playerMp = 55;
  private playerMaxMp = 55;
  private playerAlive = true;
  private gold = 0;
  private lastDeathPos = Vector3.Zero();
  private mpRegenAccum = 0;
  private hpRegenAccum = 0;
  private shadowDrainAccum = 0;

  // Systems (scene-local)
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private shadowControlHandler: ((e: PointerEvent) => void) | null = null;
  private soulStockHandler: ((e: PointerEvent) => void) | null = null;
  private safeZoneMesh: Mesh | null = null;
  private clickIndicator!: ClickIndicator;
  private levelSystem!: LevelSystem;
  private deathScreen!: DeathScreen;
  private statsUI!: StatsUI;
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

  // Yeni sistemler
  private comboChainSystem!: ComboChainSystem;
  private parrySystem!: ParrySystem;
  private targetingSystem!: TargetingSystem;
  private comboUI!: ComboUI;
  private targetingUI!: TargetingUI;
  private ariseUI!: AriseUI;
  private activeChargeSkillId: string | null = null;
  private activeChargeLevel: ChargeLevel | null = null;

  // Boss spawn zamanlayici
  private bossSpawnTimer = -1;
  private bossSpawned = false;
  private entryGracePeriod = 2; // ilk 2sn portal tetiklenmez

  // Soul stok sistemi
  private shadowStockPicker!: ShadowStockPicker;
  private shadowManageUI!: ShadowManageUI;
  private readonly STOCK_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
  private stockKeyStates = [false, false, false, false];

  constructor(game: Game) {
    this.game = game;
  }

  /** Dungeon'a girmeden once rank ayarla */
  setRank(rank: DungeonRank): void {
    this.rank = rank;
  }

  // ═══════════════════════════════════════════
  //  SCENE LIFECYCLE
  // ═══════════════════════════════════════════

  async onLoad(): Promise<void> {
    console.log(`[DUNGEON] onLoad basliyor — rank: ${this.rank}`);
    // Onceki calismanin kalintilarini temizle (tekrar giriste)
    this.cleanupPreviousRun();

    const scene = this.game.engine.scene;
    scene.collisionsEnabled = true;

    this.dungeonManager = new DungeonManager(this.rank);

    this.createArena(scene);
    this.initPlayer(scene);
    this.initCombat(scene);
    this.initProgression();
    this.initUI(scene);
    this.setupSafeZone(scene);
    this.spawnEnemies(scene);
    this.createExitPortal(scene);
    this.shadowSelection.setEnemies(this.enemies);

    this.entryGracePeriod = 2; // portal korumasi resetle
    eventBus.emit('dungeon:enter', { rank: this.rank });
    console.log(`[DUNGEON] onLoad tamamlandi — ${this.enemies.length} dusman spawn edildi`);
  }

  /**
   * Onceki dungeon calismasindan kalan kaynaklari temizle.
   * SceneManager sadece onExit cagirdigi icin onDispose cagrilmaz —
   * bu yuzden tekrar giriste eski kaynaklar elle temizlenmeli.
   */
  private cleanupPreviousRun(): void {
    // Eski event listener'i kaldir
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    // Eski canvas pointer listener'larini kaldir
    const canvas = this.game.engine.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      if (this.shadowControlHandler) {
        canvas.removeEventListener('pointerdown', this.shadowControlHandler);
        this.shadowControlHandler = null;
      }
      if (this.soulStockHandler) {
        canvas.removeEventListener('pointerdown', this.soulStockHandler);
        this.soulStockHandler = null;
      }
    }

    // Eski mesh ve fizik nesnelerini temizle
    this.meshes.forEach(m => m.dispose());
    this.meshes = [];
    this.aggregates.forEach(a => a.dispose());
    this.aggregates = [];

    // Eski dusmanlari temizle
    this.enemies.forEach(e => e.dispose());
    this.enemies = [];

    // Eski portallari temizle (meshes[] icinde olsalar bile acikca temizle)
    if (this.exitPortal) {
      this.exitPortal.dispose();
    }
    if (this.victoryPortal) {
      this.victoryPortal.dispose();
      this.victoryPortal = null;
    }

    // UI temizligi — eski DOM elemanlarini kaldir
    this.game.player?.dispose();
    this.game.playerCamera?.dispose();
    this.game.hud?.dispose();
    this.game.damageNumbers?.dispose();
    this.clickIndicator?.dispose();
    this.deathScreen?.dispose();
    this.statsUI?.dispose();
    this.skillBar?.dispose();
    this.skillEffects?.dispose();
    this.shadowArmy?.dispose();
    this.shadowSelection?.dispose();
    this.shadowUI?.dispose();
    this.shadowManageUI?.dispose();
    this.shadowStockPicker?.dispose();
    disposeDevConsole();

    // Boss state sifirla
    this.bossSpawnTimer = -1;
    this.bossSpawned = false;

    // Oyuncu state sifirla
    this.playerAlive = true;
    this.mpRegenAccum = 0;
    this.hpRegenAccum = 0;
    this.shadowDrainAccum = 0;
  }

  onEnter(): void {}

  onUpdate(dt: number): void {
    this.game.player.update(dt);
    this.game.playerCombat.update(dt);
    this.game.damageNumbers.update(dt);
    this.clickIndicator.update(dt);
    this.skillEffects.update(dt);

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

    // Skill system
    if (this.playerAlive) {
      const castResult = this.skillSystem.update(
        dt, this.playerMp, this.levelSystem.str, this.levelSystem.int,
      );
      if (castResult) {
        this.playerMp = Math.max(0, this.playerMp - castResult.mpCost);
      }
    }

    this.updateMpRegen(dt);

    // Skill bar UI
    this.skillBar.update(
      this.skillSystem.getSlots(),
      this.playerMp,
      (skillId: string) => this.skillSystem.getUpgradeLevel(skillId),
    );

    // Shadow army
    this.shadowArmy.update(ctx, this.enemies);
    this.shadowSelection.update();
    this.shadowUI.setExtractMode(
      this.game.input.isKeyDown('AltLeft') || this.game.input.isKeyDown('AltRight'),
    );
    this.shadowUI.updateCount(this.shadowArmy.getAliveCount());
    this.shadowUI.updateSoulSlots(this.shadowArmy.getSoulSlots());
    this.shadowUI.updateMode(this.shadowArmy.getMode());
    this.updateSoulSummon();

    // Boss spawn zamanlayici
    if (this.bossSpawnTimer > 0) {
      this.bossSpawnTimer -= dt;
      if (this.bossSpawnTimer <= 0) {
        this.spawnBoss(this.game.engine.scene);
      }
    }

    // Boss kosulu: tum normal dusmanlar oldu mu?
    if (!this.bossSpawned && this.dungeonManager.checkBossCondition()) {
      this.scheduleBossSpawn();
    }

    // Tamamlanma: boss oldu mu?
    if (this.dungeonManager.checkCompletion()) {
      this.onDungeonComplete();
    }

    // Portal animasyonlari
    this.updatePortals(dt);

    // Portal yakinlik kontrolu
    this.checkPortalProximity(dt);

    this.updateComboIndicator();
    this.updateArisePrompt();
    this.comboChainSystem.update(dt);
    this.parrySystem.update(dt);

    // Targeting sistemi guncelle (charge sirasinda AoE dairesi)
    if (this.activeChargeSkillId) {
      const scene = this.game.engine.scene;
      const pick = scene.pick(scene.pointerX, scene.pointerY, (m) => m.name === 'ground');
      const mouseWorld = pick?.hit && pick.pickedPoint
        ? pick.pickedPoint.clone()
        : this.game.player.getPosition().add(new Vector3(0, 0, 3));
      this.targetingSystem.update(dt, this.game.player.getPosition(), mouseWorld, this.activeChargeLevel ?? 'tap');
    }
    this.game.hud.setBlocking(ctx.player.isBlocking);
    this.updateHUD();
  }

  /** Yakin cesetlerde Arise prompt'unu goster */
  private updateArisePrompt(): void {
    const playerPos = this.game.player.getPosition();
    const ARISE_RANGE = 3.0;
    let hasNearCorpse = false;
    let nearBoss = false;

    for (const enemy of this.enemies) {
      if (!enemy.isExtractable()) continue;
      const dist = Vector3.Distance(enemy.mesh.position, playerPos);
      if (dist <= ARISE_RANGE) {
        hasNearCorpse = true;
        if (enemy.def.isBoss) nearBoss = true;
        break;
      }
    }

    if (hasNearCorpse) {
      this.ariseUI.showPrompt(nearBoss);
    } else {
      this.ariseUI.hidePrompt();
    }
  }

  onExit(): void {
    const rewards = this.dungeonManager.getRewards();
    const completed = this.dungeonManager.isCompleted();

    // Odulleri oyuncuya ver
    if (completed) {
      this.levelSystem.addXp(rewards.xp);
      this.gold += rewards.gold;
    }

    eventBus.emit('dungeon:exit', {
      rank: this.rank,
      completed,
      rewards,
    });

    // Paylasilan state'i game'e geri yaz (TestScene bunlari okuyacak)
    this.game.levelSystem = this.levelSystem;
    this.game.shadowProfileManager = this.shadowProfileManager;
    this.game.shadowInventory = this.shadowInventory;
    this.game.gold = this.gold;
    this.game.skillSystem = this.skillSystem;
    this.game.savedSoulSlots = this.shadowArmy.exportSoulSlots();
    this.game.savedActiveShadows = this.shadowArmy.exportActiveShadows();

    // Tum kaynaklari temizle (geri donuste onLoad tekrar olusturur)
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    // Canvas pointer listener'larini temizle (leak onleme)
    const canvas = this.game.engine.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      if (this.shadowControlHandler) {
        canvas.removeEventListener('pointerdown', this.shadowControlHandler);
        this.shadowControlHandler = null;
      }
      if (this.soulStockHandler) {
        canvas.removeEventListener('pointerdown', this.soulStockHandler);
        this.soulStockHandler = null;
      }
    }
    this.meshes.forEach(m => m.dispose());
    this.meshes = [];
    this.aggregates.forEach(a => a.dispose());
    this.aggregates = [];
    this.enemies.forEach(e => e.dispose());
    this.enemies = [];
    // Boss enemy dungeonManager uzerinden yonetiliyor, enemies[] icinde
    this.game.player?.dispose();
    this.game.playerCamera?.dispose();
    this.game.hud?.dispose();
    this.game.damageNumbers?.dispose();
    this.clickIndicator?.dispose();
    this.deathScreen?.dispose();
    this.statsUI?.dispose();
    this.skillBar?.dispose();
    this.skillEffects?.dispose();
    this.shadowArmy?.dispose();
    this.shadowSelection?.dispose();
    this.shadowUI?.dispose();
    this.comboUI?.dispose();
    this.targetingUI?.dispose();
    this.targetingSystem?.dispose();
    this.ariseUI?.dispose();
    if (this.exitPortal) { this.exitPortal.dispose(); }
    if (this.victoryPortal) { this.victoryPortal.dispose(); this.victoryPortal = null; }
    this.shadowStockPicker?.dispose();
    this.shadowManageUI?.dispose();
    if (this.safeZoneMesh) {
      this.safeZoneMesh.dispose(false, true);
      this.safeZoneMesh = null;
    }
    SafeZoneRegistry.removeAll();
    disposeDevConsole();
  }

  onDispose(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
    this.meshes.forEach(m => m.dispose());
    this.aggregates.forEach(a => a.dispose());
    this.enemies.forEach(e => e.dispose());
    this.game.player?.dispose();
    this.game.playerCamera?.dispose();
    this.game.hud?.dispose();
    this.game.damageNumbers?.dispose();
    this.clickIndicator?.dispose();
    this.deathScreen?.dispose();
    this.statsUI?.dispose();
    this.skillBar?.dispose();
    this.skillEffects?.dispose();
    this.shadowArmy?.dispose();
    this.shadowSelection?.dispose();
    this.shadowUI?.dispose();
    this.shadowManageUI?.dispose();
    this.shadowStockPicker?.dispose();
    if (this.victoryPortal) this.victoryPortal.dispose();
    disposeDevConsole();
  }

  // ═══════════════════════════════════════════
  //  INITIALIZATION
  // ═══════════════════════════════════════════

  private createArena(scene: Scene): void {
    const size = DUNGEON.arenaSize[this.rank];
    const colors = ARENA_COLORS[this.rank];

    // Zemin
    const ground = MeshBuilder.CreateGround('ground', {
      width: size, height: size, subdivisions: 16,
    }, scene);
    const groundMat = new StandardMaterial('dungeonGroundMat', scene);
    groundMat.diffuseColor = colors.ground;
    groundMat.specularColor = new Color3(0.03, 0.03, 0.05);
    ground.material = groundMat;
    this.meshes.push(ground);
    this.aggregates.push(
      new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene),
    );

    // Duvarlar (4 kenar)
    const wallMat = new StandardMaterial('dungeonWallMat', scene);
    wallMat.diffuseColor = colors.wall;
    wallMat.specularColor = new Color3(0.05, 0.05, 0.08);

    const halfSize = size / 2;
    const wallConfigs = [
      { name: 'wallN', w: size + WALL_THICKNESS * 2, d: WALL_THICKNESS, x: 0, z: halfSize + WALL_THICKNESS / 2 },
      { name: 'wallS', w: size + WALL_THICKNESS * 2, d: WALL_THICKNESS, x: 0, z: -(halfSize + WALL_THICKNESS / 2) },
      { name: 'wallE', w: WALL_THICKNESS, d: size, x: halfSize + WALL_THICKNESS / 2, z: 0 },
      { name: 'wallW', w: WALL_THICKNESS, d: size, x: -(halfSize + WALL_THICKNESS / 2), z: 0 },
    ];

    for (const cfg of wallConfigs) {
      const wall = MeshBuilder.CreateBox(cfg.name, {
        width: cfg.w, height: WALL_HEIGHT, depth: cfg.d,
      }, scene);
      wall.position.set(cfg.x, WALL_HEIGHT / 2, cfg.z);
      wall.material = wallMat;
      this.meshes.push(wall);
      this.aggregates.push(
        new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0 }, scene),
      );
    }

    // Arena ici engeller / sutunlar
    this.createPillars(scene, size);
  }

  /** Arena icine birkaç sutun yerlestir */
  private createPillars(scene: Scene, arenaSize: number): void {
    const pillarMat = new StandardMaterial('pillarMat', scene);
    pillarMat.diffuseColor = new Color3(0.25, 0.2, 0.3);

    const spread = arenaSize * 0.25;
    const positions = [
      new Vector3(spread, 0, spread),
      new Vector3(-spread, 0, spread),
      new Vector3(spread, 0, -spread),
      new Vector3(-spread, 0, -spread),
    ];

    for (let i = 0; i < positions.length; i++) {
      const h = 2 + Math.random();
      const pillar = MeshBuilder.CreateBox(`pillar_${i}`, {
        width: 1.5, height: h, depth: 1.5,
      }, scene);
      pillar.position.set(positions[i].x, h / 2, positions[i].z);
      pillar.material = pillarMat;
      this.meshes.push(pillar);
      this.aggregates.push(
        new PhysicsAggregate(pillar, PhysicsShapeType.BOX, { mass: 0 }, scene),
      );
    }
  }

  private initPlayer(scene: Scene): void {
    this.game.player = new PlayerController(scene, this.game.input, null);
    this.game.playerCamera = new PlayerCamera(scene, this.game.player.root);
    this.game.player.setCamera(this.game.playerCamera);
    scene.activeCamera = this.game.playerCamera.camera;

    // Dungeon girisinde oyuncuyu arena merkezine yakin spawnla (cikis portalindan uzak)
    const arenaSize = DUNGEON.arenaSize[this.rank];
    const spawnZ = -(arenaSize / 4); // Merkezin biraz guneyi
    this.game.player.mesh.position.set(0, 0.9, spawnZ);
    this.game.player.characterController.setPosition(new Vector3(0, 0.9, spawnZ));
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
    // LevelSystem — Game uzerinden paylasilan varsa onu kullan, yoksa yeni olustur
    this.levelSystem = this.game.levelSystem ?? new LevelSystem();
    this.game.levelSystem = this.levelSystem;

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
    this.gold = this.game.gold;
    this.game.playerCombat.setBaseDamage(this.levelSystem.getAttackDamage());

    this.damageCalculator = new DamageCalculator(this.levelSystem, this.game.damageNumbers);

    // Skill system + VFX manager
    this.skillEffects = new SkillEffects(this.game.engine.scene);
    const vfxMgr = new SkillVFXManager(
      this.game.engine.scene,
      this.game.playerCamera.camera,
    );
    this.skillEffects.setVFXManager(vfxMgr);
    this.skillSystem = this.game.skillSystem ?? new SkillSystem(this.game.input);
    this.game.skillSystem = this.skillSystem;
    this.skillSystem.setOnCast((result: SkillCastResult) => {
      this.handleSkillCast(result);
    });
    this.damageCalculator.setShieldReductionGetter(() => this.skillSystem.getShieldReduction());

    // Combo + Parry sistemleri
    this.comboChainSystem = new ComboChainSystem();
    this.parrySystem = new ParrySystem();

    // Charge callbacks
    this.skillSystem.setOnChargeStart((skillId, _key) => {
      this.activeChargeSkillId = skillId;
      this.activeChargeLevel = 'tap';
      this.game.player.setMoveSpeedMultiplier(0.4);
      const skillDef = this.skillSystem.getSlots().find(s => s.def.id === skillId)?.def;
      const cfg = SKILL_CHARGE[skillId];
      if (skillDef && cfg) {
        if (skillDef.type === 'aoe' || skillDef.type === 'ultimate') {
          this.targetingSystem.activate({
            mode: 'aoe_circle',
            minRadius: cfg.tap.range,
            lv1Radius: cfg.lv1.range,
            maxRadius: cfg.max.range,
            maxRange: cfg.max.range * 1.5,
            color: new Color3(0.5, 0.2, 0.8),
          });
          this.targetingUI.show(skillDef.name);
        } else if (skillDef.type === 'dash') {
          this.targetingSystem.activate({
            mode: 'direction_cone',
            minRadius: cfg.tap.range,
            lv1Radius: cfg.lv1.range,
            maxRadius: cfg.max.range,
            maxRange: cfg.max.range,
            color: new Color3(0.5, 0.2, 0.8),
            minConeAngle: Math.PI / 2,
            lv1ConeAngle: Math.PI * 2 / 3,
            maxConeAngle: Math.PI * 5 / 6,
          });
          this.targetingUI.show(skillDef.name);
        }
        // buff/shield tipleri icin targeting gosterilmez
      }
    });
    this.skillSystem.setOnChargeLevel((level, skillId) => {
      this.activeChargeLevel = level;
      const cfg = SKILL_CHARGE[skillId];
      if (cfg) {
        this.targetingUI.update(
          this.skillSystem.getChargeState(
            this.skillSystem.getSlots().find(s => s.def.id === skillId)?.def.key ?? ''
          )?.chargeTime ?? 0,
          cfg.maxThreshold,
          level,
        );
      }
      this.skillBar.updateCharge(skillId, 0, 1, level);
    });
    this.skillSystem.setOnChargeEnd(() => {
      this.targetingSystem.deactivate();
      this.targetingUI.hide();
      if (this.activeChargeSkillId) {
        this.skillBar.updateCharge(this.activeChargeSkillId, 0, 1, null);
      }
      this.activeChargeSkillId = null;
      this.activeChargeLevel = null;
      this.game.player.setMoveSpeedMultiplier(1.0);
    });

    // Shadow systems — Game uzerinden paylasilan varsa kullan
    this.shadowProfileManager = this.game.shadowProfileManager ?? new ShadowProfileManager();
    this.game.shadowProfileManager = this.shadowProfileManager;

    this.shadowInventory = this.game.shadowInventory ?? new ShadowInventory();
    this.game.shadowInventory = this.shadowInventory;

    this.dropSystem = new DropSystem(this.shadowInventory);
    this.shadowArmy = new ShadowArmy(
      this.game.engine.scene, this.getPlayerStats(), this.shadowProfileManager,
    );
    this.shadowArmy.setDamageNumbers(this.game.damageNumbers);
    // Kayitli soul slot'lari yukle
    if (this.game.savedSoulSlots) {
      this.shadowArmy.setSoulSlots(this.game.savedSoulSlots);
    }
    // Kayitli aktif golgeleri yeniden olustur
    if (this.game.savedActiveShadows && this.game.savedActiveShadows.length > 0) {
      this.shadowArmy.importActiveShadows(this.game.savedActiveShadows);
      this.game.savedActiveShadows = undefined;
    }
    this.shadowSelection = new ShadowSelection(
      this.game.engine.scene, this.shadowArmy, this.game.input,
    );
    this.shadowSelection.setDamageNumbers(this.game.damageNumbers);
  }

  private initUI(scene: Scene): void {
    this.game.hud = new HUD();
    this.updateHUD();

    this.deathScreen = new DeathScreen();
    // Dungeon ici respawn — yerinde veya sehirde
    this.deathScreen.setOnRespawnHere(() => {
      this.dungeonManager.applyDeathPenalty();
      this.respawnPlayer(this.lastDeathPos);
    });
    this.deathScreen.setOnRespawnStart(() => {
      this.dungeonManager.applyCityRespawnPenalty();
      // Sehir respawn: dungeon'dan tamamen cik
      this.exitDungeon();
    });

    this.statsUI = new StatsUI(this.levelSystem);
    this.statsUI.setOnStatChanged(() => this.applyStats());

    this.clickIndicator = new ClickIndicator(scene);
    this.skillBar = new SkillBar();
    this.skillBar.initSlots(this.skillSystem.getSlots());
    this.shadowUI = new ShadowUI();

    this.comboUI = new ComboUI();
    this.targetingUI = new TargetingUI();
    this.targetingSystem = new TargetingSystem(scene, this.game.playerCamera.camera);
    this.ariseUI = new AriseUI();

    this.shadowManageUI = new ShadowManageUI(
      this.shadowProfileManager,
      this.shadowInventory,
      (name: string) => ENEMY_DEFS[name] ?? DUNGEON_BOSS_DEFS[name] ?? null,
    );
    if (this.game.playerRankSystem) {
      this.shadowManageUI.setPlayerRankSystem(this.game.playerRankSystem);
    }
    this.shadowManageUI.setInDungeon(true);

    // Soul slot click opens manage UI with that slot's shadow selected
    this.shadowUI.setOnSlotClick((slotIndex: number) => {
      const slots = this.shadowArmy.getSoulSlots();
      const slot = slots[slotIndex];
      if (slot && slot.profiles.length > 0) {
        this.shadowManageUI.selectShadow(slot.profiles[0].uid);
        this.shadowManageUI.open();
      }
    });

    // Tab = golge yonetim, P = stat dagitim (dungeon icinde degistirilemez ama gorulebilir), G = mod
    this.keyHandler = (e: KeyboardEvent): void => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this.shadowManageUI.toggle();
      }
      if (e.code === 'KeyG') {
        const newMode = this.shadowArmy.toggleMode();
        this.shadowUI.updateMode(newMode);
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.setupShadowControls(scene);
    this.setupSoulStockControls(scene);
    this.shadowStockPicker = new ShadowStockPicker();

    this.game.playerCamera.setOnRightClickGround((worldPos) => {
      this.game.player.setAutoMoveTarget(worldPos);
      this.game.playerCombat.cancelAutoAttack();
      this.clickIndicator.spawn(worldPos);
    });

    // Dev console — dungeon icinde de calissin
    initDevConsole({
      levelSystem: this.levelSystem,
      player: this.game.player,
      combat: this.game.playerCombat,
      getEnemies: () => this.enemies,
      getHp: () => this.playerHp,
      getMp: () => this.playerMp,
      setHp: (v) => { this.playerHp = v; },
      setMp: (v) => { this.playerMp = v; },
      applyStats: () => { this.applyStats(); this.updateHUD(); },
    });
  }

  // ═══════════════════════════════════════════
  //  ENEMY SPAWNING
  // ═══════════════════════════════════════════

  private setupSafeZone(scene: Scene): void {
    SafeZoneRegistry.removeAll();

    const arenaSize = DUNGEON.arenaSize[this.rank];
    const spawnZ = -(arenaSize / 4);
    const center = new Vector3(0, 0, spawnZ);
    const radius = 6;
    const zone = new SafeZone(center, radius);
    SafeZoneRegistry.addZone(zone);

    // Mavi tonlu gorsel (dungeon icin)
    this.safeZoneMesh = createSafeZoneMesh(
      scene, center, radius,
      new Color3(0.37, 0.65, 0.97), // mavi
    );
  }

  // ═══════════════════════════════════════════

  private spawnEnemies(scene: Scene): void {
    const entries = this.dungeonManager.getEnemyDefs();
    const arenaSize = DUNGEON.arenaSize[this.rank];
    const spawnRadius = arenaSize * 0.35;

    for (const entry of entries) {
      for (let i = 0; i < entry.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 4 + Math.random() * spawnRadius;
        const pos = new Vector3(
          Math.cos(angle) * dist,
          0,
          Math.sin(angle) * dist,
        );
        this.createEnemy(scene, pos, entry.typeKey, entry.def);
      }
    }

    // Dungeon dusmanlarinin leash range'ini arena boyutuna ayarla
    const arenaLeash = arenaSize * 0.8;
    for (const enemy of this.enemies) {
      enemy.ai.setLeashRange(arenaLeash);
    }

    this.dungeonManager.registerEnemies(this.enemies);
  }

  private createEnemy(
    scene: Scene, pos: Vector3, typeKey: string, def: import('../enemies/Enemy').EnemyDef,
  ): void {
    const enemy = new Enemy(scene, pos, def);
    enemy.typeKey = typeKey;
    this.game.combatSystem.registerTarget(enemy);

    enemy.setOnDeath((e) => {
      this.game.combatSystem.unregisterTarget(enemy);
      // XP ve gold hem dungeon sayacina hem oyuncuya
      this.dungeonManager.addXp(e.def.xpReward);
      this.dungeonManager.addGold(e.def.goldReward);
      this.levelSystem.addXp(e.def.xpReward);
      this.gold += e.def.goldReward;
      this.dropSystem.rollDrops(typeKey, e.def.level);
      this.dropSystem.addGold(e.def.goldReward);
      this.game.hud.showXpGain(e.def.xpReward);
      this.updateHUD();
    });

    enemy.setOnAttackPlayer((rawDamage, isBackstab) => {
      this.handleEnemyAttack(enemy, rawDamage, isBackstab);
    });

    enemy.setOnAttackThreat((damage, threatPos) => {
      const shadows = this.shadowArmy.getShadows();
      let nearestShadow: (typeof shadows)[number] | null = null;
      let nearestDist = Infinity;
      for (const s of shadows) {
        if (!s.isAlive()) continue;
        const dist = s.position.subtract(threatPos).length();
        if (dist < SHADOW.threatSearchRange && dist < nearestDist) {
          nearestShadow = s;
          nearestDist = dist;
        }
      }
      if (nearestShadow) {
        nearestShadow.takeDamage(damage);
        this.game.damageNumbers.spawn(
          nearestShadow.mesh.position.add(new Vector3(0, 1.5, 0)),
          damage, 'player_hurt',
        );
      }
    });

    this.enemies.push(enemy);
  }

  // ═══════════════════════════════════════════
  //  BOSS
  // ═══════════════════════════════════════════

  private scheduleBossSpawn(): void {
    this.bossSpawnTimer = DUNGEON.bossSpawnDelay;
    this.bossSpawned = true;
  }

  private spawnBoss(scene: Scene): void {
    const bossDef = this.dungeonManager.getBossDef();
    if (!bossDef) return;

    const bossPos = new Vector3(0, 0, 0); // Arena merkezi
    const boss = new Enemy(scene, bossPos, bossDef.def);
    boss.typeKey = bossDef.typeKey;

    // Boss gorusel farkliligi: daha buyuk
    boss.mesh.scaling.scaleInPlace(1.3);
    // Boss asla spawn noktasina donmez — tum arena boyunca kovalar
    boss.ai.setLeashRange(9999);

    this.game.combatSystem.registerTarget(boss);

    boss.setOnDeath((e) => {
      this.game.combatSystem.unregisterTarget(boss);
      this.dungeonManager.addXp(e.def.xpReward);
      this.dungeonManager.addGold(e.def.goldReward);
      this.levelSystem.addXp(e.def.xpReward);
      this.gold += e.def.goldReward;
      // Boss drop — ozel yetenek kitaplari dusurur
      this.dropSystem.rollDrops(bossDef.typeKey, e.def.level);
      this.game.hud.showXpGain(e.def.xpReward);
      this.updateHUD();

      const rankDef = DUNGEON_RANK_DEFS[this.rank];
      eventBus.emit('dungeon:bossDeath', { bossType: rankDef.bossType });
    });

    boss.setOnAttackPlayer((rawDamage, isBackstab) => {
      this.handleEnemyAttack(boss, rawDamage, isBackstab);
    });

    boss.setOnAttackThreat((damage, threatPos) => {
      const shadows = this.shadowArmy.getShadows();
      let nearestShadow: (typeof shadows)[number] | null = null;
      let nearestDist = Infinity;
      for (const s of shadows) {
        if (!s.isAlive()) continue;
        const dist = s.position.subtract(threatPos).length();
        if (dist < SHADOW.threatSearchRange && dist < nearestDist) {
          nearestShadow = s;
          nearestDist = dist;
        }
      }
      if (nearestShadow) {
        nearestShadow.takeDamage(damage);
        this.game.damageNumbers.spawn(
          nearestShadow.mesh.position.add(new Vector3(0, 1.5, 0)),
          damage, 'player_hurt',
        );
      }
    });

    this.enemies.push(boss);
    this.dungeonManager.registerBoss(boss);
    this.shadowSelection.setEnemies(this.enemies);

    const rankDef = DUNGEON_RANK_DEFS[this.rank];
    eventBus.emit('dungeon:bossSpawn', { bossType: rankDef.bossType });
  }

  // ═══════════════════════════════════════════
  //  PORTALS
  // ═══════════════════════════════════════════

  private createExitPortal(scene: Scene): void {
    const arenaSize = DUNGEON.arenaSize[this.rank];
    const portalZ = -(arenaSize / 2 - 1); // Duvara yakin, oyuncu spawn'indan uzak

    this.exitPortal = MeshBuilder.CreateTorus('exitPortal', {
      diameter: 3, thickness: 0.2, tessellation: 32,
    }, scene);
    this.exitPortal.position.set(0, 1.5, portalZ);

    const mat = new StandardMaterial('exitPortalMat', scene);
    mat.diffuseColor = new Color3(0.2, 0.4, 0.9);
    mat.emissiveColor = new Color3(0.1, 0.2, 0.6);
    this.exitPortal.material = mat;
    this.meshes.push(this.exitPortal);
  }

  private spawnVictoryPortal(): void {
    if (this.victoryPortal) return;
    const scene = this.game.engine.scene;

    this.victoryPortal = MeshBuilder.CreateTorus('victoryPortal', {
      diameter: 4, thickness: 0.25, tessellation: 32,
    }, scene);
    this.victoryPortal.position.set(0, 1.5, 0);

    const mat = new StandardMaterial('victoryPortalMat', scene);
    mat.diffuseColor = new Color3(0.9, 0.75, 0.2);
    mat.emissiveColor = new Color3(0.6, 0.5, 0.1);
    this.victoryPortal.material = mat;
  }

  private updatePortals(dt: number): void {
    if (this.exitPortal) {
      this.exitPortal.rotation.y += dt * SCENE.portalRotationSpeed;
      this.exitPortal.rotation.x = Math.sin(Date.now() / 1000) * SCENE.portalBobAmplitude;
    }
    if (this.victoryPortal) {
      this.victoryPortal.rotation.y += dt * SCENE.portalRotationSpeed * 1.5;
      this.victoryPortal.rotation.x = Math.sin(Date.now() / 800) * SCENE.portalBobAmplitude * 1.5;
    }
  }

  private checkPortalProximity(dt: number): void {
    if (!this.playerAlive) return;
    const playerPos = this.game.player.getPosition();

    // Grace period: dungeon'a girdikten sonra 2sn portal tetiklenmez
    if (this.entryGracePeriod > 0) {
      this.entryGracePeriod -= dt;
      return;
    }

    // Cikis portali — her zaman aktif
    if (this.exitPortal) {
      const dist = playerPos.subtract(this.exitPortal.position);
      dist.y = 0;
      if (dist.length() < DUNGEON.gateProximityRadius) {
        this.exitDungeon();
        return;
      }
    }

    // Zafer portali — sadece boss oldukten sonra
    if (this.victoryPortal) {
      const dist = playerPos.subtract(this.victoryPortal.position);
      dist.y = 0;
      if (dist.length() < DUNGEON.gateProximityRadius) {
        this.exitDungeon();
      }
    }
  }

  private onDungeonComplete(): void {
    this.spawnVictoryPortal();
  }

  private exitDungeon(): void {
    // Sahne degisimi: test sahnesine don
    this.game.sceneManager.switchTo('test').catch((err: unknown) => {
      if (err instanceof Error) {
        throw new Error(`Dungeon exit failed: ${err.message}`);
      }
    });
  }

  // ═══════════════════════════════════════════
  //  DAMAGE HANDLING
  // ═══════════════════════════════════════════

  private handleEnemyAttack(enemy: Enemy, rawDamage: number, isBackstab: boolean): void {
    if (!this.playerAlive) return;

    // Parry sistemi kontrol
    const parryResult = this.parrySystem.checkParry(rawDamage, enemy);
    if (parryResult !== null) {
      const reflected = parryResult.reflectedDamage;
      if (reflected > 0) {
        enemy.takeDamage(reflected, false, this.game.player.getPosition());
        this.game.damageNumbers.spawn(
          enemy.mesh.position.add(new Vector3(0, 1.5, 0)),
          reflected,
          'critical',
        );
      }
      const vfxMgr = this.skillEffects.getVFXManager();
      if (vfxMgr) {
        playParryVFX(vfxMgr, this.game.engine.scene, this.game.player.getPosition());
      }
      eventBus.emit('parry:success', { reflectedDamage: reflected });
      return;
    }

    const result = this.damageCalculator.calculateIncomingDamage(rawDamage, isBackstab, {
      playerPos: this.game.player.getPosition(),
      playerRotY: this.game.player.mesh.rotation.y,
      playerIsBlocking: this.game.player.getIsBlocking(),
      playerIsAttacking: this.game.playerCombat.getComboSystem().getIsAttacking(),
      enemyMeshPos: enemy.mesh.position,
    });

    if (result.type !== 'parry') {
      const passiveReduce = this.skillSystem.getPassiveDamageReduction();
      const finalDmg = passiveReduce > 0
        ? Math.max(1, Math.round(result.damage * (1 - passiveReduce)))
        : result.damage;
      this.playerHp = Math.max(0, this.playerHp - finalDmg);
    }

    eventBus.emit('player:damage', { amount: result.damage, type: result.type });
    this.updateHUD();

    if (this.shadowArmy.getMode() === 'defense' && this.shadowArmy.getAliveCount() > 0) {
      this.shadowArmy.commandAllToAttack(enemy);
    }

    if (this.playerHp <= 0 && this.playerAlive) {
      this.playerAlive = false;
      this.lastDeathPos = this.game.player.getPosition().clone();
      this.shadowArmy.killAllShadows();
      this.deathScreen.show();
      eventBus.emit('player:death', { position: this.lastDeathPos });
    }
  }

  // ═══════════════════════════════════════════
  //  SHADOW CONTROLS (dungeon icinde)
  // ═══════════════════════════════════════════

  private setupShadowControls(scene: Scene): void {
    const canvas = scene.getEngine().getRenderingCanvas()!;

    this.shadowControlHandler = (e: PointerEvent) => {
      if (!e.altKey) return;
      e.preventDefault();

      if (e.button === 0) {
        this.handleAltLeftClick(scene);
      } else if (e.button === 2) {
        this.handleAltRightClick(scene);
      }
    };
    canvas.addEventListener('pointerdown', this.shadowControlHandler);
  }

  private handleAltLeftClick(scene: Scene): void {
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
      enemy.typeKey,
    );

    if (success) {
      enemy.markExtracted();
      const isBoss = enemy.def.isBoss;
      this.ariseUI.showAriseLabel(isBoss);
      const vfxMgr = this.skillEffects.getVFXManager();
      if (vfxMgr) {
        playAriseVFX(vfxMgr, this.game.engine.scene, pos.add(new Vector3(0, 0.1, 0)));
      }
      eventBus.emit('arise:success', { shadowType: enemy.typeKey });
    } else {
      this.ariseUI.showFailMessage();
      this.game.damageNumbers.spawn(pos.add(new Vector3(0, 2, 0)), 0, 'extract_fail');
      enemy.markExtracted();
      eventBus.emit('arise:fail', { reason: 'resistance' });
    }
  }

  // ─── SOUL STOK KONTROLLERI ───

  private setupSoulStockControls(scene: Scene): void {
    const canvas = scene.getEngine().getRenderingCanvas()!;
    this.soulStockHandler = (e: PointerEvent) => {
      if (e.button !== 0 || e.altKey) return;
      let slotIndex = -1;
      for (let i = 0; i < 4; i++) {
        if (this.game.input.isKeyDown(this.STOCK_KEYS[i])) { slotIndex = i; break; }
      }
      if (slotIndex === -1) return;
      const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name.startsWith('shadow_'));
      if (!pickResult?.hit || !pickResult.pickedMesh) return;
      const shadow = this.shadowArmy.getShadows().find(s => s.mesh === pickResult.pickedMesh && s.isAlive());
      if (!shadow) return;
      const success = this.shadowArmy.stockShadow(slotIndex, shadow);
      if (success) {
        this.game.damageNumbers.spawn(shadow.mesh.position.add(new Vector3(0, 1.5, 0)), 0, 'skill');
      }
    };
    canvas.addEventListener('pointerdown', this.soulStockHandler);
  }

  private updateSoulSummon(): void {
    const altDown = this.game.input.isKeyDown('AltLeft') || this.game.input.isKeyDown('AltRight');
    if (!altDown) { this.stockKeyStates = [false, false, false, false]; return; }
    if (this.shadowStockPicker.isOpen()) return;
    for (let i = 0; i < 4; i++) {
      const isDown = this.game.input.isKeyDown(this.STOCK_KEYS[i]);
      if (isDown && !this.stockKeyStates[i]) {
        const slots = this.shadowArmy.getSoulSlots();
        const slot = slots[i];
        if (!slot || !slot.enemyDef || slot.count <= 0) { this.stockKeyStates[i] = isDown; continue; }
        if (slot.count === 1) {
          const playerPos = this.game.player.getPosition().clone();
          const offset = this.game.player.getForwardDirection().scale(-SHADOW.summonOffsetDistance);
          const spawnPos = playerPos.add(offset); spawnPos.y = 0;
          const success = this.shadowArmy.summonFromStock(i, spawnPos, this.levelSystem.level);
          if (success) { this.game.damageNumbers.spawn(spawnPos.add(new Vector3(0, 2, 0)), 0, 'arise'); }
        } else {
          const slotIndex = i;
          this.shadowStockPicker.open(slot, slotIndex, (profileIndex: number) => {
            const playerPos = this.game.player.getPosition().clone();
            const offset = this.game.player.getForwardDirection().scale(-SHADOW.summonOffsetDistance);
            const spawnPos = playerPos.add(offset); spawnPos.y = 0;
            const success = this.shadowArmy.summonFromStockByIndex(slotIndex, profileIndex, spawnPos);
            if (success) { this.game.damageNumbers.spawn(spawnPos.add(new Vector3(0, 2, 0)), 0, 'arise'); }
          });
        }
      }
      this.stockKeyStates[i] = isDown;
    }
  }

  // ═══════════════════════════════════════════
  //  SKILL EFFECTS
  // ═══════════════════════════════════════════

  private applyAoeDamage(
    center: Vector3, range: number, damage: number,
    onHit?: (enemy: Enemy) => void,
  ): void {
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      // Dusman pozisyonunu kullan (mesh.position Y-offsetli, position gercek zemin pos)
      const dx = enemy.position.x - center.x;
      const dz = enemy.position.z - center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Dusman govde yaricapini hesaba kat — daire kenarindaki dusmanlar da hasar almali
      const enemyRadius = 0.35 * enemy.def.scale;
      if (dist - enemyRadius > range) continue;
      enemy.takeDamage(damage, false, center);
      this.game.damageNumbers.spawn(
        enemy.mesh.position.add(new Vector3(0, 1.5, 0)), damage, 'skill',
      );
      if (onHit) onHit(enemy);
    }
  }

  private handleSkillCast(result: SkillCastResult): void {
    const { skill, damage, chargeLevel, range } = result;
    const skillId = skill.id;
    const playerPos = this.game.player.getPosition();

    // Combo bonus kontrol
    const comboBonus = this.comboChainSystem.checkCombo(skillId);
    const finalDamage = comboBonus ? Math.round(damage * comboBonus.damageMult) : damage;
    const finalRange = comboBonus?.doubleAoe ? range * 2 : (comboBonus?.rangeMult ?? 1) * range;

    if (comboBonus) {
      this.comboUI.showComboName(comboBonus.link.name);
    }

    // Targeting sisteminden hedef pozisyonu al
    const targetPos = this.targetingSystem.isActive()
      ? this.targetingSystem.getTargetPosition()
      : playerPos.clone();

    switch (skillId) {
      case 'phantomStrike': {
        const dir = this.game.player.getForwardDirection();
        const strikeRange = finalRange || SKILLS.phantomStrike.range;
        const hitCount = chargeLevel === 'max' ? 7 : chargeLevel === 'lv1' ? 5 : 3;
        const coneHalf = chargeLevel === 'max' ? Math.PI * 5 / 12
          : chargeLevel === 'lv1' ? Math.PI / 3
          : Math.PI / 4;
        const coneDot = Math.cos(coneHalf);

        this.skillEffects.spawnPhantomStrike(playerPos.clone(), dir, hitCount, chargeLevel);

        const targets: Enemy[] = [];
        for (const enemy of this.enemies) {
          if (!enemy.isAlive()) continue;
          const toEnemy = enemy.position.subtract(playerPos);
          toEnemy.y = 0;
          const dist = toEnemy.length();
          if (dist > strikeRange + 0.35 * enemy.def.scale) continue;
          if (dist > 0.01 && Vector3.Dot(dir, toEnemy.normalize()) < coneDot) continue;
          targets.push(enemy);
        }

        const perHitDmg = Math.round(finalDamage / hitCount * 1.5);
        const isCrit = comboBonus?.autoCrit ?? false;
        const hitDelay = 80;

        for (let i = 0; i < hitCount; i++) {
          const isFinal = i === hitCount - 1;
          setTimeout(() => {
            for (const enemy of targets) {
              if (!enemy.isAlive()) continue;
              const dmg = isFinal ? Math.round(perHitDmg * 1.5) : perHitDmg;
              enemy.takeDamage(dmg, isCrit && isFinal, playerPos);
              this.game.damageNumbers.spawn(
                enemy.mesh.position.add(new Vector3(0, 1.5 + (i % 3) * 0.3, 0)),
                dmg, isCrit && isFinal ? 'critical' : 'skill',
              );
            }
            if (isFinal && chargeLevel === 'max') {
              this.applyAoeDamage(playerPos, strikeRange * 1.5, Math.round(finalDamage * 0.3));
            }
            if (isFinal && chargeLevel !== 'tap') {
              for (const enemy of targets) {
                if (!enemy.isAlive()) continue;
                const kb = enemy.position.subtract(playerPos);
                kb.y = 0;
                if (kb.length() > 0.01) {
                  enemy.position.addInPlace(kb.normalize().scale(1.5));
                }
              }
            }
          }, i * hitDelay);
        }
        break;
      }
      case 'shadowShield': {
        const shieldCharge = SKILL_CHARGE['shadowShield'];
        const cv = shieldCharge ? shieldCharge[chargeLevel] : null;
        const parryWindow = cv?.parryWindow ?? PARRY_CONFIG.defaultWindow;
        const shieldDuration = cv?.duration ?? SKILLS.shadowShield.duration;
        this.parrySystem.activateParry({
          window: parryWindow,
          stunDuration: PARRY_CONFIG.defaultStun,
          reflectPercent: PARRY_CONFIG.defaultReflect,
        });
        this.skillEffects.spawnShieldSphere(
          () => this.game.player.getPosition(), shieldDuration, chargeLevel,
        );
        break;
      }
      case 'shadowBurst': {
        const burstRange = finalRange || SKILLS.shadowBurst.range;
        const burstCenter = chargeLevel !== 'tap' ? targetPos : playerPos.clone();
        this.skillEffects.spawnBurstRing(burstCenter, burstRange, chargeLevel);
        this.applyAoeDamage(burstCenter, burstRange, finalDamage);
        if (chargeLevel === 'max') {
          setTimeout(() => this.applyAoeDamage(burstCenter, burstRange * 0.7, Math.round(finalDamage * 0.5)), 300);
          setTimeout(() => this.applyAoeDamage(burstCenter, burstRange * 0.5, Math.round(finalDamage * 0.3)), 600);
        }
        break;
      }
      case 'sovereignAura': {
        const auraRange = finalRange || SKILLS.sovereignAura.range;
        const auraCenter = chargeLevel !== 'tap' ? targetPos : playerPos.clone();
        this.skillEffects.spawnAuraWave(auraCenter, auraRange, chargeLevel);
        this.applyAoeDamage(auraCenter, auraRange, finalDamage, (enemy) => {
          enemy.applySlow(SKILLS.sovereignAura.slowMultiplier, SKILLS.sovereignAura.slowDuration);
        });
        break;
      }

      // ─── BOSS SKILLS (her skill kendi VFX'ini kullanir) ───
      default: {
        const bossDef = BOSS_SKILL_DEFS[skillId];
        if (bossDef) {
          const bossRange = bossDef.range ?? 5;
          switch (skillId) {
            case 'skill_flame_burst':
              this.skillEffects.spawnFlameburst(playerPos.clone(), bossRange);
              this.applyAoeDamage(playerPos, bossRange, finalDamage);
              break;
            case 'skill_lightning_chain':
              this.skillEffects.spawnLightningChain(playerPos.clone(), bossRange);
              this.applyAoeDamage(playerPos, bossRange, finalDamage);
              break;
            case 'skill_ice_prison':
              this.skillEffects.spawnIcePrison(playerPos.clone(), bossDef.duration ?? 5);
              break;
            case 'skill_blood_rage':
              this.skillEffects.spawnBloodRage(() => this.game.player.getPosition(), bossDef.duration ?? 8);
              break;
            case 'skill_shadow_domain':
              this.skillEffects.spawnShadowDomain(playerPos.clone(), bossRange);
              this.applyAoeDamage(playerPos, bossRange, finalDamage, (enemy) => {
                if (bossDef.slowMultiplier && bossDef.slowDuration) {
                  enemy.applySlow(bossDef.slowMultiplier, bossDef.slowDuration);
                }
              });
              break;
            case 'skill_void_strike': {
              const dir = this.game.player.getForwardDirection();
              const endPos = playerPos.add(dir.scale(bossRange));
              this.skillEffects.spawnVoidStrike(playerPos.clone(), endPos, dir, bossRange);
              this.game.player.dashTo(bossRange, bossDef.duration ?? 0.3);
              for (const enemy of this.enemies) {
                if (!enemy.isAlive()) continue;
                const toEnemy = enemy.mesh.position.subtract(playerPos);
                toEnemy.y = 0;
                if (toEnemy.length() > bossRange) continue;
                if (Vector3.Dot(dir, toEnemy.normalize()) < 0.5) continue;
                enemy.takeDamage(finalDamage, false, playerPos);
                this.game.damageNumbers.spawn(
                  enemy.mesh.position.add(new Vector3(0, 1.5, 0)), finalDamage, 'skill',
                );
              }
              break;
            }
            default:
              switch (bossDef.type) {
                case 'aoe':
                  this.skillEffects.spawnBurstRing(playerPos.clone(), bossRange);
                  this.applyAoeDamage(playerPos, bossRange, finalDamage);
                  break;
                case 'dash': {
                  const dir = this.game.player.getForwardDirection();
                  this.skillEffects.spawnDashTrail(playerPos.clone(), dir, bossRange);
                  this.game.player.dashTo(bossRange, bossDef.duration ?? 0.3);
                  break;
                }
                case 'buff':
                  this.skillEffects.spawnShieldSphere(() => this.game.player.getPosition(), bossDef.duration ?? 5);
                  break;
                case 'ultimate':
                  this.skillEffects.spawnAuraWave(playerPos.clone(), bossRange);
                  this.applyAoeDamage(playerPos, bossRange, finalDamage);
                  break;
              }
          }
        }
        break;
      }
    }
    eventBus.emit('skill:hit', {
      skillId, damage,
      targetCount: this.enemies.filter(e => e.isAlive()).length,
    });
  }

  // ═══════════════════════════════════════════
  //  MP / HP REGEN
  // ═══════════════════════════════════════════

  private updateMpRegen(dt: number): void {
    if (!this.playerAlive) return;

    this.mpRegenAccum += dt;
    if (this.mpRegenAccum >= MP.regenInterval) {
      this.mpRegenAccum -= MP.regenInterval;
      const regen = this.levelSystem.getMpRegen();
      this.playerMp = Math.min(this.playerMaxMp, this.playerMp + regen);
    }

    const hpRegenPct = this.skillSystem.getPassiveHpRegenPercent();
    if (hpRegenPct > 0 && this.playerHp < this.playerMaxHp) {
      this.hpRegenAccum += dt;
      if (this.hpRegenAccum >= 1) {
        this.hpRegenAccum -= 1;
        const heal = Math.round(this.playerMaxHp * hpRegenPct);
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
        this.updateHUD();
      }
    }

    // Golge mana drain
    const aliveCount = this.shadowArmy.getAliveCount();
    if (aliveCount > 0) {
      this.shadowDrainAccum += dt;
      if (this.shadowDrainAccum >= SHADOW.manaDrainInterval) {
        this.shadowDrainAccum -= SHADOW.manaDrainInterval;
        const drain = this.shadowArmy.getManaDrainPerSecond(this.levelSystem.level);
        this.playerMp -= drain;

        if (this.playerMp < 0) {
          this.playerMp = 0;
          const hpDrain = aliveCount * SHADOW.hpDrainPerSecond;
          this.playerHp = Math.max(0, this.playerHp - hpDrain);
          this.updateHUD();

          if (this.playerHp <= 0 && this.playerAlive) {
            this.playerAlive = false;
            this.lastDeathPos = this.game.player.getPosition().clone();
            this.shadowArmy.killAllShadows();
            this.deathScreen.show();
            eventBus.emit('player:death', { position: this.lastDeathPos });
          }
        }
      }
    }

    this.shadowArmy.updateStockHealing(dt);
  }

  // ═══════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════

  private updateHUD(): void {
    this.game.hud.setHP(this.playerHp, this.playerMaxHp);
    const mpRegen = this.levelSystem.getMpRegen();
    const mpDrain = this.shadowArmy.getAliveCount() > 0
      ? this.shadowArmy.getManaDrainPerSecond(this.levelSystem.level)
      : 0;
    this.game.hud.setMP(this.playerMp, this.playerMaxMp, mpRegen, mpDrain);
    this.game.hud.setXP(this.levelSystem.getXpPercent());
    this.game.hud.setLevel(this.levelSystem.level);
    this.game.hud.setGold(this.gold);
  }

  private getPlayerStats(): PlayerStats {
    return {
      str: this.levelSystem.str,
      vit: this.levelSystem.vit,
      agi: this.levelSystem.agi,
      int: this.levelSystem.int,
      maxHp: this.levelSystem.getMaxHp(),
      maxMp: this.levelSystem.getMaxMp(),
      attackDamage: this.levelSystem.getAttackDamage(),
      critChance: this.levelSystem.getCritChance(),
      attackSpeed: this.levelSystem.getAttackSpeed(),
      moveSpeed: this.levelSystem.getMoveSpeed(),
      defense: this.levelSystem.getDefense(),
    };
  }

  private applyStats(): void {
    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
    this.playerMaxMp = this.levelSystem.getMaxMp();
    this.playerMp = Math.min(this.playerMp, this.playerMaxMp);
    this.game.playerCombat.setBaseDamage(this.levelSystem.getAttackDamage());
    this.game.playerCombat.getComboSystem().setAttackSpeed(this.levelSystem.getAttackSpeed());

    const ps = this.getPlayerStats();
    this.shadowArmy.setPlayerStats(ps);
    this.shadowManageUI.setPlayerStats(ps);
    this.updateHUD();
  }

  private respawnPlayer(pos: Vector3): void {
    this.playerAlive = true;
    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = this.playerMaxHp;
    this.game.player.mesh.position.set(pos.x, pos.y + 0.9, pos.z);
    this.game.player.characterController.setPosition(new Vector3(pos.x, pos.y + 0.9, pos.z));
    this.game.playerCombat.cancelAutoAttack();
    this.playerMp = this.playerMaxMp;
    this.updateHUD();
    eventBus.emit('player:respawn', { position: pos });
  }

  private updateComboIndicator(): void {
    const combo = this.game.playerCombat.getComboSystem();
    if (combo.getIsAttacking() && this.game.playerCombat.getLastHitCount() > 0) {
      this.game.hud.showCombo(combo.getComboIndex());
    }
  }
}
