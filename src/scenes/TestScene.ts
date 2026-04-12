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
import { EnemyModelCache } from '../enemies/EnemyModelCache';
import { LevelSystem } from '../progression/LevelSystem';
import { RespawnManager } from '../systems/RespawnManager';
import { ENEMY_DEFS } from '../data/enemies';
import { DUNGEON_BOSS_DEFS } from '../data/dungeonBosses';
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
import { ShadowStockPicker } from '../ui/ShadowStockPicker';
import { BOOK_TO_SKILL_MAP, BOSS_SKILL_BOOK_IDS, BOSS_SKILL_DEFS } from '../data/shadowSkillBooks';
import { SafeZone, SafeZoneRegistry, createSafeZoneMesh } from '../systems/SafeZone';
import { SkillVFXManager } from '../vfx/SkillVFXManager';
import type { PlayerStats } from '../shadows/ShadowEnhancementTypes';
import { SKILLS, MP, SHADOW, DUNGEON, SKILL_CHARGE, PARRY_CONFIG, SLOW_MOTION } from '../config/GameConfig';
import { ComboChainSystem } from '../skills/ComboChainSystem';
import { ParrySystem } from '../skills/ParrySystem';
import { TargetingSystem } from '../skills/TargetingSystem';
import type { ChargeLevel } from '../skills/ChargeSystem';
import { ComboUI } from '../ui/ComboUI';
import { TargetingUI } from '../ui/TargetingUI';
import type { SkillCastResult } from '../skills/SkillSystem';
import { playParryVFX } from '../vfx/skills/ParryVFX';
import { playAriseVFX } from '../vfx/skills/AriseVFX';
import { AriseUI } from '../ui/AriseUI';
import { initDevConsole, disposeDevConsole } from '../systems/DevConsole';
import { DungeonSelectUI } from '../ui/DungeonSelectUI';
import { DungeonCooldownTracker } from '../dungeon/DungeonCooldownTracker';
import { PlayerRankSystem } from '../progression/PlayerRankSystem';
import type { DungeonRank } from '../dungeon/types';
import type { DungeonScene } from './DungeonScene';

export class TestScene implements GameScene {
  public name = 'test';
  private game: Game;
  private meshes: Mesh[] = [];
  private aggregates: PhysicsAggregate[] = [];
  private enemies: Enemy[] = [];

  // Systems
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private shadowControlHandler: ((e: PointerEvent) => void) | null = null;
  private soulStockHandler: ((e: PointerEvent) => void) | null = null;
  private skillSlotSyncHandler: (() => void) | null = null;
  private safeZoneMesh: Mesh | null = null;
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
  private shadowStockPicker!: ShadowStockPicker;
  private dungeonSelectUI!: DungeonSelectUI;
  private cooldownTracker!: DungeonCooldownTracker;
  private playerRankSystem!: PlayerRankSystem;
  private comboChainSystem!: ComboChainSystem;
  private parrySystem!: ParrySystem;
  private targetingSystem!: TargetingSystem;
  private comboUI!: ComboUI;
  private targetingUI!: TargetingUI;
  private ariseUI!: AriseUI;
  private portalMesh: Mesh | null = null;
  private wasNearPortal = false;
  /** Aktif charge bilgisi (skill bar ve targeting UI icin) */
  private activeChargeSkillId: string | null = null;
  private activeChargeLevel: ChargeLevel | null = null;

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
    this.setupSafeZone(scene);
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
    // Paylasilan state: dungeon'dan donuste mevcut verileri koru
    this.levelSystem = this.game.levelSystem ?? new LevelSystem();
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
    this.respawnManager.setOnRespawn((enemy) => {
      this.game.combatSystem.registerTarget(enemy);
    });
    this.damageCalculator = new DamageCalculator(this.levelSystem, this.game.damageNumbers);

    // Skill system + VFX manager
    this.skillEffects = new SkillEffects(this.game.engine.scene);
    // VFX manager olustur ve SkillEffects'e bagla
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

    // Charge callbacks → UI guncelle
    this.skillSystem.setOnChargeStart((skillId, _key) => {
      this.activeChargeSkillId = skillId;
      this.activeChargeLevel = 'tap';
      // Charge sirasinda hareket hizini yavasla
      this.game.player.setMoveSpeedMultiplier(0.4);
      const skillDef = this.skillSystem.getSlots().find(s => s.def.id === skillId)?.def;
      const cfg = SKILL_CHARGE[skillId];
      if (skillDef && cfg) {
        // AoE veya ultimate → targeting circle
        if (skillDef.type === 'aoe' || skillDef.type === 'ultimate') {
          this.targetingSystem.activate({
            mode: 'aoe_circle',
            minRadius: cfg.tap.range,
            lv1Radius: cfg.lv1.range,
            maxRadius: cfg.max.range,
            maxRange: cfg.max.range * 1.5,
            color: new Color3(0.5, 0.2, 0.8),
          });
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
        }
        this.targetingUI.show(skillDef.name);
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
      // Hareket hizini normale dondur
      this.game.player.setMoveSpeedMultiplier(1.0);
    });

    // Shield buff → DamageCalculator baglantisi
    this.damageCalculator.setShieldReductionGetter(() => this.skillSystem.getShieldReduction());

    // Combo zincir sistemi
    this.comboChainSystem = new ComboChainSystem();

    // Parry sistemi
    this.parrySystem = new ParrySystem();

    // Shadow profile & inventory — dungeon'dan donuste mevcut verileri koru
    this.shadowProfileManager = this.game.shadowProfileManager ?? new ShadowProfileManager();
    this.shadowInventory = this.game.shadowInventory ?? new ShadowInventory();
    this.dropSystem = new DropSystem(this.shadowInventory);

    // Shadow army + selection (pass playerStats and profileManager)
    this.shadowArmy = new ShadowArmy(this.game.engine.scene, this.getPlayerStats(), this.shadowProfileManager);
    this.shadowArmy.setDamageNumbers(this.game.damageNumbers);
    // Kayitli soul slot'lari yukle (dungeon'dan donus)
    if (this.game.savedSoulSlots) {
      this.shadowArmy.setSoulSlots(this.game.savedSoulSlots);
    }
    // Kayitli aktif golgeleri yeniden olustur
    if (this.game.savedActiveShadows && this.game.savedActiveShadows.length > 0) {
      this.shadowArmy.importActiveShadows(this.game.savedActiveShadows);
      this.game.savedActiveShadows = undefined;
    }
    this.shadowSelection = new ShadowSelection(this.game.engine.scene, this.shadowArmy, this.game.input);
    this.shadowSelection.setDamageNumbers(this.game.damageNumbers);

    // Dungeon cooldown tracker — persist across scenes
    if (!this.cooldownTracker) {
      this.cooldownTracker = new DungeonCooldownTracker();
    }

    // Player rank system — persist across scenes
    if (!this.playerRankSystem) {
      this.playerRankSystem = new PlayerRankSystem();
      const startingSkills = Object.values(SKILLS).map(s => ({
        id: s.id,
        name: s.name,
        rank: s.rank as import('../dungeon/types').PlayerRank,
        power: s.power,
        key: s.key,
        type: s.type,
      }));
      this.playerRankSystem.initializeStartingSkills(startingSkills);
    }

    // Dungeon'dan donuste gold'u geri al
    this.gold = this.game.gold;

    // Paylasilan state'i Game nesnesine aktar
    this.game.levelSystem = this.levelSystem;
    this.game.shadowProfileManager = this.shadowProfileManager;
    this.game.shadowInventory = this.shadowInventory;
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

    this.comboUI = new ComboUI();
    this.targetingUI = new TargetingUI();
    this.targetingSystem = new TargetingSystem(scene);
    this.ariseUI = new AriseUI();

    this.shadowUI = new ShadowUI();
    this.shadowManageUI = new ShadowManageUI(
      this.shadowProfileManager,
      this.shadowInventory,
      (name: string) => ENEMY_DEFS[name] ?? DUNGEON_BOSS_DEFS[name] ?? null,
    );
    this.shadowManageUI.setPlayerRankSystem(this.playerRankSystem);
    this.shadowManageUI.setInDungeon(false);
    this.shadowStockPicker = new ShadowStockPicker();

    // Dungeon gate secim paneli
    this.dungeonSelectUI = new DungeonSelectUI(
      (rank: DungeonRank) => {
        this.enterDungeon(rank);
      },
      this.cooldownTracker,
      () => this.playerRankSystem.getRank(),
    );

    // Kitap kullanma callback'i — envanterdeki kitabi tuketip skill'i guclendirir veya ogretir
    this.shadowManageUI.setOnUseBook((bookId: string): boolean => {
      const skillId = BOOK_TO_SKILL_MAP[bookId];
      if (!skillId) return false;
      if (!this.shadowInventory.removeItem(bookId, 1)) return false;

      // Boss skill kitabi → PlayerRankSystem havuzuna ekle
      if (BOSS_SKILL_BOOK_IDS.has(bookId)) {
        const bossDef = BOSS_SKILL_DEFS[bookId];
        if (!bossDef) return false;
        this.playerRankSystem.addSkillToPool({
          id: bossDef.id,
          name: bossDef.name,
          rank: (bossDef.rank ?? 'E') as import('../dungeon/types').PlayerRank,
          power: bossDef.power ?? 10,
          key: bossDef.key,
          type: bossDef.type,
        });
        return true;
      }

      // Normal upgrade kitabi → mevcut yetenegini guclendir
      return this.skillSystem.upgradeSkill(skillId);
    });

    // Skill slot senkronizasyonu — PlayerRankSystem slot degistiginde SkillSystem + SkillBar guncelle
    this.skillSlotSyncHandler = () => { this.syncSkillSlots(); };
    eventBus.on('stat:changed', this.skillSlotSyncHandler);
    eventBus.on('autoAttack:toggle', (data: { enabled: boolean }) => {
      this.game.hud.setAutoAttack(data.enabled);
    });

    // Tab key toggles shadow manage UI, G key toggles shadow combat mode
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
      applyStats: () => { this.applyStats(); this.updateHUD(); },
      teleportTo: (x, y, z) => { this.game.player.root.position.set(x, y, z); },
      enterDungeon: (rank) => { this.enterDungeon(rank as DungeonRank); },
      playerRankSystem: this.playerRankSystem,
      skillSystem: this.skillSystem,
      inventory: this.shadowInventory,
    });

    this.game.playerCamera.setOnRightClickGround((worldPos) => {
      this.game.player.setAutoMoveTarget(worldPos);
      this.game.playerCombat.cancelAutoAttack();
      this.clickIndicator.spawn(worldPos);
    });
  }

  // ─── SAFE ZONE ───

  private setupSafeZone(scene: Scene): void {
    // Onceki zone'lari temizle (sahne gecisi)
    SafeZoneRegistry.removeAll();

    // Spawn noktasinda guvenli bolge
    const center = Vector3.Zero();
    const radius = 8;
    const zone = new SafeZone(center, radius);
    SafeZoneRegistry.addZone(zone);

    // Gorsel
    this.safeZoneMesh = createSafeZoneMesh(scene, center, radius);
  }

  // ─── ENEMY SPAWNING ───

  private async spawnEnemies(scene: Scene): Promise<void> {
    // Overworld dusmanlarinin modellerini onceden yukle
    const typeKeys = Object.keys(SCENE.spawns);
    await EnemyModelCache.getInstance().preloadModels(typeKeys, scene);

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
    enemy.typeKey = type;
    // 3D model yukle (fire-and-forget)
    enemy.loadModel(scene, type);
    this.game.combatSystem.registerTarget(enemy);

    enemy.setOnDeath((e) => {
      this.game.combatSystem.unregisterTarget(enemy);
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

    // Parry sistemi aktif mi kontrol et
    const parryResult = this.parrySystem.checkParry(rawDamage, enemy);
    if (parryResult !== null) {
      // Parry basarili — hasar yansitma
      const reflected = parryResult.reflectedDamage;
      if (reflected > 0) {
        enemy.takeDamage(reflected, false, this.game.player.getPosition());
        this.game.damageNumbers.spawn(
          enemy.mesh.position.add(new Vector3(0, 1.5, 0)),
          reflected,
          'critical',
        );
      }
      // Parry VFX
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
      // Demir Irade passive hasar azaltma
      const passiveReduce = this.skillSystem.getPassiveDamageReduction();
      const finalDmg = passiveReduce > 0
        ? Math.max(1, Math.round(result.damage * (1 - passiveReduce)))
        : result.damage;
      this.playerHp = Math.max(0, this.playerHp - finalDmg);
    }

    eventBus.emit('player:damage', { amount: result.damage, type: result.type });
    this.updateHUD();

    // Savunma modunda oyuncu saldirildiginda golgeleri saldiran dusmana yonlendir
    if (this.shadowArmy.getMode() === 'defense' && this.shadowArmy.getAliveCount() > 0) {
      this.shadowArmy.commandAllToAttack(enemy);
    }

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
    this.soulStockHandler = (e: PointerEvent) => {
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
    };
    canvas.addEventListener('pointerdown', this.soulStockHandler);
  }

  /** Alt + 1/2/3/4 kontrol (onUpdate icinden cagrilir) */
  private updateSoulSummon(): void {
    const altDown = this.game.input.isKeyDown('AltLeft') || this.game.input.isKeyDown('AltRight');
    if (!altDown) {
      this.stockKeyStates = [false, false, false, false];
      return;
    }

    // Picker acikken yeni summon girisi engelle
    if (this.shadowStockPicker.isOpen()) return;

    for (let i = 0; i < 4; i++) {
      const isDown = this.game.input.isKeyDown(this.STOCK_KEYS[i]);
      if (isDown && !this.stockKeyStates[i]) {
        const slots = this.shadowArmy.getSoulSlots();
        const slot = slots[i];
        if (!slot || !slot.enemyDef || slot.count <= 0) {
          this.stockKeyStates[i] = isDown;
          continue;
        }

        if (slot.count === 1) {
          // Tek golge varsa direkt cagir (mevcut davranis)
          const playerPos = this.game.player.getPosition().clone();
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
        } else {
          // 2+ golge varsa picker popup ac
          const slotIndex = i;
          this.shadowStockPicker.open(slot, slotIndex, (profileIndex: number) => {
            const playerPos = this.game.player.getPosition().clone();
            const offset = this.game.player.getForwardDirection().scale(-SHADOW.summonOffsetDistance);
            const spawnPos = playerPos.add(offset);
            spawnPos.y = 0;

            const success = this.shadowArmy.summonFromStockByIndex(
              slotIndex, profileIndex, spawnPos,
            );
            if (success) {
              this.game.damageNumbers.spawn(
                spawnPos.add(new Vector3(0, 2, 0)),
                0, 'arise',
              );
            }
          });
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

    // Skill bar UI update (upgrade seviyesi ile)
    this.skillBar.update(
      this.skillSystem.getSlots(),
      this.playerMp,
      (skillId: string) => this.skillSystem.getUpgradeLevel(skillId),
    );

    // Shadow army + selection update
    this.shadowArmy.update(ctx, this.enemies);
    this.shadowSelection.update();
    this.updateSoulSummon();
    this.shadowUI.setExtractMode(this.game.input.isKeyDown('AltLeft') || this.game.input.isKeyDown('AltRight'));
    this.shadowUI.updateCount(this.shadowArmy.getAliveCount());
    this.shadowUI.updateSoulSlots(this.shadowArmy.getSoulSlots());
    this.shadowUI.updateMode(this.shadowArmy.getMode());

    this.updateComboIndicator();
    this.updatePortal(dt);
    this.updateTargetingSystem(dt);
    this.updateComboChainUI();
    this.updateArisePrompt();
    this.comboChainSystem.update(dt);
    this.parrySystem.update(dt);

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

  private updateTargetingSystem(dt: number): void {
    if (!this.targetingSystem.isActive()) return;
    const scene = this.game.engine.scene;
    // Fare zemi pozisyonu
    const pick = scene.pick(scene.pointerX, scene.pointerY, (m) => {
      return m.name === 'ground';
    });
    const mouseWorld = pick?.hit && pick.pickedPoint
      ? pick.pickedPoint.clone()
      : this.game.player.getPosition().add(new Vector3(0, 0, 3));

    const level = this.activeChargeLevel ?? 'tap';
    this.targetingSystem.update(dt, this.game.player.getPosition(), mouseWorld, level);

    // Charge bar guncelle
    if (this.activeChargeSkillId) {
      const key = this.skillSystem.getSlots().find(s => s.def.id === this.activeChargeSkillId)?.def.key ?? '';
      const state = this.skillSystem.getChargeState(key);
      const cfg = SKILL_CHARGE[this.activeChargeSkillId];
      if (state && cfg) {
        this.targetingUI.update(state.chargeTime, cfg.maxThreshold, level);
        this.skillBar.updateCharge(this.activeChargeSkillId, state.chargeTime, cfg.maxThreshold, level);
      }
    }
  }

  private updateComboChainUI(): void {
    const remaining = this.comboChainSystem.getWindowRemaining();
    const streak = this.comboChainSystem.getStreakCount();
    this.comboUI.showWindow(remaining, 1.5, streak);

    // Skill bar'da combo yapilabilecek slotlari parlat
    if (remaining > 0) {
      const possibleCombos = this.comboChainSystem.getPossibleCombos();
      const targetIds = possibleCombos.map(c => c.to);
      this.skillBar.setComboHighlight(targetIds, true);
    } else {
      this.skillBar.setComboHighlight([], false);
    }
  }

  private updateComboIndicator(): void {
    const combo = this.game.playerCombat.getComboSystem();
    if (combo.getIsAttacking() && this.game.playerCombat.getLastHitCount() > 0) {
      this.game.hud.showCombo(combo.getComboIndex());
    }
  }

  private updatePortal(dt: number): void {
    if (!this.portalMesh) return;

    this.portalMesh.rotation.y += dt * SCENE.portalRotationSpeed;
    this.portalMesh.rotation.x = Math.sin(Date.now() / 1000) * SCENE.portalBobAmplitude;

    // Portal yakinlik kontrolu — oyuncu yaklasinca DungeonSelectUI ac
    if (this.playerAlive) {
      const playerPos = this.game.player.getPosition();
      const toPortal = playerPos.subtract(this.portalMesh.position);
      toPortal.y = 0;
      const dist = toPortal.length();
      const isNear = dist < DUNGEON.gateProximityRadius;

      if (isNear && !this.wasNearPortal && !this.dungeonSelectUI.isOpen()) {
        this.dungeonSelectUI.open();
      } else if (!isNear && this.wasNearPortal && this.dungeonSelectUI.isOpen()) {
        this.dungeonSelectUI.close();
      }
      this.wasNearPortal = isNear;
    }
  }

  /** Dungeon'a gir — cooldown baslat, rank ayarla, sahne degistir */
  private enterDungeon(rank: DungeonRank): void {
    this.cooldownTracker.startCooldown(rank);

    // Paylasilan state'i guncelle
    this.game.levelSystem = this.levelSystem;
    this.game.shadowProfileManager = this.shadowProfileManager;
    this.game.shadowInventory = this.shadowInventory;
    this.game.gold = this.gold;
    this.game.skillSystem = this.skillSystem;
    this.game.playerRankSystem = this.playerRankSystem;
    this.game.savedSoulSlots = this.shadowArmy.exportSoulSlots();
    this.game.savedActiveShadows = this.shadowArmy.exportActiveShadows();
    this.game.dungeonRank = rank;

    // DungeonScene'e rank aktar ve sahne degistir
    const dungeonScene = this.game.sceneManager.getScene('dungeon') as DungeonScene | undefined;
    if (dungeonScene) {
      dungeonScene.setRank(rank);
    }

    this.game.sceneManager.switchTo('dungeon').then(() => {
      console.log('[SCENE] Dungeon sahnesine basariyla gecildi');
    }).catch((err: unknown) => {
      console.error('[SCENE] Dungeon giris hatasi:', err);
    });
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

  /** Alt + sol tik: olu cesede → cikar, canli dusmana → golgeleri yonlendir */
  private handleAltLeftClick(scene: Scene): void {
    // Once olu cesede cikarma dene (capsule veya model mesh)
    const extractPick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
      // Sadece enemy'ye ait mesh'leri filtrele
      return this.enemies.some(e => e.ownsMesh(mesh));
    });

    if (extractPick?.hit && extractPick.pickedMesh) {
      const pickedMesh = extractPick.pickedMesh;
      const deadEnemy = this.enemies.find(
        e => e.ownsMesh(pickedMesh) && e.isExtractable(),
      );

      if (deadEnemy) {
        this.tryExtractShadow(deadEnemy);
        return;
      }

      // Canli dusman ise → golgeleri yonlendir
      const aliveEnemy = this.enemies.find(
        e => e.ownsMesh(pickedMesh) && e.isAlive(),
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
      enemy.typeKey,
    );

    if (success) {
      enemy.markExtracted();
      // AriseUI + AriseVFX
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

  // ─── SKILL EFFECTS ───

  /** Yaricap icindeki dusmanlara skill hasari uygula */
  private applyAoeDamage(
    center: Vector3, range: number, damage: number,
    onHit?: (enemy: Enemy) => void,
  ): number {
    let hitCount = 0;
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
      hitCount++;
    }
    return hitCount;
  }

  private handleSkillCast(result: SkillCastResult): void {
    const { skill, damage, chargeLevel, range } = result;
    const skillId = skill.id;
    const playerPos = this.game.player.getPosition();

    // Combo bonus kontrol
    const comboBonus = this.comboChainSystem.checkCombo(skillId);
    const finalDamage = comboBonus ? Math.round(damage * comboBonus.damageMult) : damage;
    const finalRange  = comboBonus?.doubleAoe ? range * 2 : (comboBonus?.rangeMult ?? 1) * range;
    const isFree      = comboBonus?.freeCast ?? false;

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
        // Charge seviyesinden vurus sayisi: tap=3, lv1=5, max=7
        const hitCount = chargeLevel === 'max' ? 7 : chargeLevel === 'lv1' ? 5 : 3;
        // Koni acisi: tap=90°, lv1=120°, max=150°
        const coneHalf = chargeLevel === 'max' ? Math.PI * 5 / 12
          : chargeLevel === 'lv1' ? Math.PI / 3
          : Math.PI / 4;
        const coneDot = Math.cos(coneHalf);

        // VFX
        this.skillEffects.spawnPhantomStrike(playerPos.clone(), dir, hitCount, chargeLevel);

        // Koni icindeki dusmanlari bul
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

        // Her vurus icin ardisik hasar
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
            // MAX son vurus: AoE patlama (yakin dusmanlara ekstra hasar)
            if (isFinal && chargeLevel === 'max') {
              this.applyAoeDamage(playerPos, strikeRange * 1.5, Math.round(finalDamage * 0.3));
            }
            // LV1+ son vurus: knockback
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
        // Charge seviyesine gore parry penceresi
        const shieldCharge = SKILL_CHARGE['shadowShield'];
        const cv = shieldCharge ? shieldCharge[chargeLevel] : null;
        const parryWindow  = cv?.parryWindow ?? PARRY_CONFIG.defaultWindow;
        const shieldDuration = cv?.duration ?? SKILLS.shadowShield.duration;
        this.parrySystem.activateParry({
          window: parryWindow,
          stunDuration: PARRY_CONFIG.defaultStun,
          reflectPercent: PARRY_CONFIG.defaultReflect,
        });
        this.skillEffects.spawnShieldSphere(
          () => this.game.player.getPosition(), shieldDuration,
          chargeLevel,
        );
        break;
      }
      case 'shadowBurst': {
        const burstRange = finalRange || SKILLS.shadowBurst.range;
        // Charge varsa hedef noktada, yoksa oyuncu merkezli
        const burstCenter = chargeLevel !== 'tap' ? targetPos : playerPos.clone();
        this.skillEffects.spawnBurstRing(burstCenter, burstRange, chargeLevel);
        this.applyAoeDamage(burstCenter, burstRange, finalDamage);
        // MAX: 3x patlama
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
          enemy.applySlow(SKILLS.sovereignAura.slowMultiplier ?? 0.5, SKILLS.sovereignAura.slowDuration ?? 3);
        });
        break;
      }

      // ─── BOSS SKILLS (her skill kendi VFX'ini kullanir) ───
      default: {
        const bossDef = BOSS_SKILL_DEFS[skillId];
        if (bossDef) {
          const range = bossDef.range ?? 5;
          switch (skillId) {
            case 'skill_flame_burst':
              this.skillEffects.spawnFlameburst(playerPos.clone(), range);
              this.applyAoeDamage(playerPos, range, damage);
              break;
            case 'skill_lightning_chain':
              this.skillEffects.spawnLightningChain(playerPos.clone(), range);
              this.applyAoeDamage(playerPos, range, damage);
              break;
            case 'skill_ice_prison':
              this.skillEffects.spawnIcePrison(playerPos.clone(), bossDef.duration ?? 5);
              break;
            case 'skill_blood_rage':
              this.skillEffects.spawnBloodRage(() => this.game.player.getPosition(), bossDef.duration ?? 8);
              break;
            case 'skill_shadow_domain':
              this.skillEffects.spawnShadowDomain(playerPos.clone(), range);
              this.applyAoeDamage(playerPos, range, damage, (enemy) => {
                if (bossDef.slowMultiplier && bossDef.slowDuration) {
                  enemy.applySlow(bossDef.slowMultiplier, bossDef.slowDuration);
                }
              });
              break;
            case 'skill_void_strike': {
              const dir = this.game.player.getForwardDirection();
              const endPos = playerPos.add(dir.scale(range));
              this.skillEffects.spawnVoidStrike(playerPos.clone(), endPos, dir, range);
              this.game.player.dashTo(range, bossDef.duration ?? 0.3);
              for (const enemy of this.enemies) {
                if (!enemy.isAlive()) continue;
                const toEnemy = enemy.mesh.position.subtract(playerPos);
                toEnemy.y = 0;
                if (toEnemy.length() > range) continue;
                if (Vector3.Dot(dir, toEnemy.normalize()) < 0.5) continue;
                enemy.takeDamage(damage, false, playerPos);
                this.game.damageNumbers.spawn(
                  enemy.mesh.position.add(new Vector3(0, 1.5, 0)), damage, 'skill',
                );
              }
              break;
            }
            default:
              // Bilinmeyen boss skill — fallback olarak tip bazli
              switch (bossDef.type) {
                case 'aoe':
                  this.skillEffects.spawnBurstRing(playerPos.clone(), range);
                  this.applyAoeDamage(playerPos, range, damage);
                  break;
                case 'dash': {
                  const dir = this.game.player.getForwardDirection();
                  this.skillEffects.spawnDashTrail(playerPos.clone(), dir, range);
                  this.game.player.dashTo(range, bossDef.duration ?? 0.3);
                  break;
                }
                case 'buff':
                  this.skillEffects.spawnShieldSphere(() => this.game.player.getPosition(), bossDef.duration ?? 5);
                  break;
                case 'ultimate':
                  this.skillEffects.spawnAuraWave(playerPos.clone(), range);
                  this.applyAoeDamage(playerPos, range, damage);
                  break;
              }
          }
        }
        break;
      }
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

    // HP regen (Karanlik Yenilenme passive kitabi)
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
    const mpRegen = this.levelSystem.getMpRegen();
    const mpDrain = this.shadowArmy.getAliveCount() > 0
      ? this.shadowArmy.getManaDrainPerSecond(this.levelSystem.level)
      : 0;
    this.game.hud.setMP(this.playerMp, this.playerMaxMp, mpRegen, mpDrain);
    this.game.hud.setXP(this.levelSystem.getXpPercent());
    this.game.hud.setLevel(this.levelSystem.level);
    this.game.hud.setGold(this.gold);
  }

  /** Oyuncu statlarini PlayerStats nesnesi olarak dondur (golge stat hesaplamasi icin) */
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

  /**
   * PlayerRankSystem slot atamalarini SkillSystem ve SkillBar'a yansitir.
   * stat:changed event'i tetiklendiginde cagirilir.
   */
  private syncSkillSlots(): void {
    const slotAssignments = this.playerRankSystem.getSlotAssignments();
    const keyMap: Record<string, string> = { Q: 'KeyQ', E: 'KeyE', R: 'KeyR', F: 'KeyF' };

    // Varsayilan skill tanimlari (baslangic yetenekleri)
    const defaultSkills: Record<string, import('../skills/SkillDef').SkillDef> = {
      KeyQ: SKILLS.phantomStrike,
      KeyE: SKILLS.shadowShield,
      KeyR: SKILLS.shadowBurst,
      KeyF: SKILLS.sovereignAura,
    };

    for (const [slot, skillId] of Object.entries(slotAssignments)) {
      const keyCode = keyMap[slot];
      if (!keyCode) continue;

      if (skillId && BOSS_SKILL_DEFS[skillId]) {
        // Boss skill atandi — SkillSystem'deki slot'u degistir
        const bossSkillDef = { ...BOSS_SKILL_DEFS[skillId], key: keyCode };
        this.skillSystem.replaceSlotByKey(keyCode, bossSkillDef);
      } else {
        // Bos veya varsayilan skill — orijinale geri dondur
        const defaultDef = defaultSkills[keyCode];
        if (defaultDef) {
          this.skillSystem.replaceSlotByKey(keyCode, defaultDef);
        }
      }
    }

    // SkillBar UI'ini yeniden olustur
    this.skillBar.refreshSlots(this.skillSystem.getSlots());
  }

  private applyStats(): void {
    this.playerMaxHp = this.levelSystem.getMaxHp();
    this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
    this.playerMaxMp = this.levelSystem.getMaxMp();
    this.playerMp = Math.min(this.playerMp, this.playerMaxMp);
    this.game.playerCombat.setBaseDamage(this.levelSystem.getAttackDamage());
    this.game.playerCombat.getComboSystem().setAttackSpeed(this.levelSystem.getAttackSpeed());

    // Golge ordusuna guncel oyuncu statlarini aktar
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
    this.portalMesh = torus;
  }

  onExit(): void {
    console.log('[TEST] onExit basliyor — kaynaklar temizleniyor');
    // Sahne degistiginde tum kaynaklari temizle (geri donuste onLoad tekrar olusturur)
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    // EventBus listener temizle
    if (this.skillSlotSyncHandler) {
      eventBus.off('stat:changed', this.skillSlotSyncHandler);
      this.skillSlotSyncHandler = null;
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
    this.game.player?.dispose();
    this.game.playerCamera?.dispose();
    this.game.hud?.dispose();
    this.game.damageNumbers?.dispose();
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
    this.shadowStockPicker?.dispose();
    this.dungeonSelectUI?.dispose();
    this.comboUI?.dispose();
    this.targetingUI?.dispose();
    this.targetingSystem?.dispose();
    this.ariseUI?.dispose();
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
    this.shadowStockPicker?.dispose();
    this.dungeonSelectUI?.dispose();
    disposeDevConsole();
  }
}
