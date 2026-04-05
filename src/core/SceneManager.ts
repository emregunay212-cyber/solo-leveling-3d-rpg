export interface GameScene {
  name: string;
  onLoad(): Promise<void>;
  onEnter(): void;
  onUpdate(dt: number): void;
  onExit(): void;
  onDispose(): void;
}

export class SceneManager {
  private scenes = new Map<string, GameScene>();
  private activeScene: GameScene | null = null;

  public register(scene: GameScene): void {
    this.scenes.set(scene.name, scene);
  }

  public async switchTo(sceneName: string): Promise<void> {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      throw new Error(`Scene "${sceneName}" not found`);
    }

    // Exit current scene
    if (this.activeScene) {
      this.activeScene.onExit();
    }

    // Load and enter new scene
    await newScene.onLoad();
    newScene.onEnter();
    this.activeScene = newScene;
  }

  public update(dt: number): void {
    this.activeScene?.onUpdate(dt);
  }

  public getActiveScene(): GameScene | null {
    return this.activeScene;
  }

  public getScene(name: string): GameScene | undefined {
    return this.scenes.get(name);
  }

  public dispose(): void {
    this.scenes.forEach(scene => scene.onDispose());
    this.scenes.clear();
    this.activeScene = null;
  }
}
