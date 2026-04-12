import { Engine } from './core/Engine';
import { InputManager } from './core/InputManager';
import { SceneManager } from './core/SceneManager';
import { EventBus } from './core/EventBus';
import { PlayerController } from './player/PlayerController';
import { PlayerCamera } from './player/PlayerCamera';
import { PlayerCombat } from './player/PlayerCombat';
import { CombatSystem } from './combat/CombatSystem';
import { DamageNumbers } from './combat/DamageNumbers';
import { HUD } from './ui/HUD';
import { TestScene } from './scenes/TestScene';
import { DungeonScene } from './scenes/DungeonScene';
import type { LevelSystem } from './progression/LevelSystem';
import type { ShadowProfileManager } from './shadows/ShadowProfileManager';
import type { ShadowInventory } from './systems/ShadowInventory';
import type { DungeonRank } from './dungeon/types';

export class Game {
  public engine: Engine;
  public input: InputManager;
  public sceneManager: SceneManager;
  public eventBus: EventBus;
  public player!: PlayerController;
  public playerCamera!: PlayerCamera;
  public playerCombat!: PlayerCombat;
  public combatSystem!: CombatSystem;
  public damageNumbers!: DamageNumbers;
  public hud!: HUD;

  // Sahneler arasi paylasilan state
  public levelSystem?: LevelSystem;
  public shadowProfileManager?: ShadowProfileManager;
  public shadowInventory?: ShadowInventory;
  public dungeonRank?: DungeonRank;
  public gold = 0;
  public savedSoulSlots?: import('./shadows/ShadowArmy').SoulSlot[];
  public skillSystem?: import('./skills/SkillSystem').SkillSystem;
  public playerRankSystem?: import('./progression/PlayerRankSystem').PlayerRankSystem;
  public savedActiveShadows?: { profile: import('./shadows/ShadowEnhancementTypes').ShadowProfile; hpPercent: number; def: import('./enemies/Enemy').EnemyDef; typeKey?: string }[];

  constructor() {
    this.engine = new Engine('gameCanvas');
    this.input = new InputManager(this.engine.getCanvas());
    this.sceneManager = new SceneManager();
    this.eventBus = new EventBus();
  }

  public async init(): Promise<void> {
    // Initialize Havok physics engine
    await this.engine.initPhysics();

    // Create scenes
    const testScene = new TestScene(this);
    this.sceneManager.register(testScene);

    const dungeonScene = new DungeonScene(this);
    this.sceneManager.register(dungeonScene);

    // Load initial scene
    await this.sceneManager.switchTo('test');

    // Hide loading screen
    this.hideLoadingScreen();

    // Start game loop
    this.engine.startRenderLoop(() => {
      const dt = this.engine.getDeltaTime();
      this.update(dt);
    });
  }

  private update(dt: number): void {
    // Clamp dt - minimum 1ms, max 50ms to avoid physics explosions
    const clampedDt = Math.max(0.001, Math.min(dt, 0.05));
    this.sceneManager.update(clampedDt);
  }

  private hideLoadingScreen(): void {
    const loading = document.getElementById('loadingScreen');
    if (loading) {
      loading.style.transition = 'opacity 0.5s';
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 500);
    }
  }

  public dispose(): void {
    this.sceneManager.dispose();
    this.engine.dispose();
    this.eventBus.clear();
  }
}
