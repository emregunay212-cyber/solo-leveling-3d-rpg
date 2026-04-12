import { Scene } from '@babylonjs/core/scene';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF';
import { ENEMY_MODEL } from '../config/GameConfig';
import { ENEMY_MODEL_MAP } from '../data/enemyModels';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import type { Node } from '@babylonjs/core/node';

export interface ModelInstance {
  rootNode: Node;
  animationGroups: AnimationGroup[];
}

/**
 * Singleton cache — her GLB bir kez yuklenir, her enemy icin bagimsiz instance olusturulur.
 * AssetContainer + instantiateModelsToScene patterni kullanir:
 * - Her instance bagimsiz skeleton ve AnimationGroup alir
 * - Simple clone paylasilan skeleton kullanir (tum ayni tip dusmanlar ayni animasyonu oynar)
 */
export class EnemyModelCache {
  private static instance: EnemyModelCache | null = null;
  private containers: Map<string, AssetContainer> = new Map();
  private loadingPromises: Map<string, Promise<AssetContainer | null>> = new Map();
  private currentScene: Scene | null = null;

  public static getInstance(): EnemyModelCache {
    if (!EnemyModelCache.instance) {
      EnemyModelCache.instance = new EnemyModelCache();
    }
    return EnemyModelCache.instance;
  }

  /**
   * Dungeon basinda cagirilir — gereken tum GLB'leri onceden yukler.
   * @param typeKeys — dungeon'da spawn olacak enemy typeKey'leri
   */
  public async preloadModels(typeKeys: string[], scene: Scene): Promise<void> {
    // Scene degistiyse eski container'lari temizle (dungeon gecisi vb.)
    if (this.currentScene && this.currentScene !== scene) {
      this.clearContainers();
    }
    this.currentScene = scene;

    const uniqueFiles = new Set<string>();
    for (const key of typeKeys) {
      const config = ENEMY_MODEL_MAP[key];
      if (config && !this.containers.has(config.glbFile)) {
        uniqueFiles.add(config.glbFile);
      }
    }

    const promises = Array.from(uniqueFiles).map(file => this.loadContainer(file, scene));
    await Promise.allSettled(promises);
  }

  /** Eski container'lari temizle (scene degisimi icin) */
  private clearContainers(): void {
    for (const container of this.containers.values()) {
      container.dispose();
    }
    this.containers.clear();
    this.loadingPromises.clear();
  }

  /**
   * Enemy icin bagimsiz model instance olusturur.
   * Basarisiz olursa null doner (capsule fallback kullanilir).
   */
  public createInstance(typeKey: string, scene: Scene): ModelInstance | null {
    const config = ENEMY_MODEL_MAP[typeKey];
    if (!config) return null;

    const container = this.containers.get(config.glbFile);
    if (!container) return null;

    try {
      const instance = container.instantiateModelsToScene(
        (name) => `${typeKey}_${name}_${Date.now()}`,
        true, // cloneMaterials — her instance kendi materialine sahip (hit flash icin gerekli)
      );

      if (instance.rootNodes.length === 0) return null;

      return {
        rootNode: instance.rootNodes[0],
        animationGroups: instance.animationGroups,
      };
    } catch {
      return null;
    }
  }

  private async loadContainer(glbFile: string, scene: Scene): Promise<AssetContainer | null> {
    // Zaten yukleniyor mu?
    const existing = this.loadingPromises.get(glbFile);
    if (existing) return existing;

    const promise = this.doLoad(glbFile, scene);
    this.loadingPromises.set(glbFile, promise);
    return promise;
  }

  private async doLoad(glbFile: string, scene: Scene): Promise<AssetContainer | null> {
    try {
      const container = await SceneLoader.LoadAssetContainerAsync(
        ENEMY_MODEL.modelsPath,
        glbFile,
        scene,
      );

      // Animasyonlari durdur — instance'lar kendi kopyalarini alacak
      for (const group of container.animationGroups) {
        group.stop();
      }

      this.containers.set(glbFile, container);
      return container;
    } catch {
      // GLB bulunamadi / yuklenemedi — sessizce devam et (fallback)
      this.loadingPromises.delete(glbFile);
      return null;
    }
  }

  public dispose(): void {
    for (const container of this.containers.values()) {
      container.dispose();
    }
    this.containers.clear();
    this.loadingPromises.clear();
    EnemyModelCache.instance = null;
  }
}
