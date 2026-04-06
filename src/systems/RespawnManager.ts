import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Enemy } from '../enemies/Enemy';
import { SCENE } from '../config/GameConfig';

interface RespawnEntry {
  enemy: Enemy;
  timer: number;
  pos: Vector3;
}

/**
 * Dusman respawn zamanlayicisi.
 * Olen dusmanlari belirli sure sonra yeniden dogurur.
 */
export class RespawnManager {
  private timers: RespawnEntry[] = [];
  private onRespawnCb: ((enemy: Enemy) => void) | null = null;

  /** Respawn oldugunda cagrilacak callback (ornegin combatSystem.registerTarget) */
  public setOnRespawn(cb: (enemy: Enemy) => void): void {
    this.onRespawnCb = cb;
  }

  /**
   * Olen dusmani respawn kuyruğuna ekle.
   */
  public schedule(enemy: Enemy, pos: Vector3): void {
    this.timers.push({
      enemy,
      timer: SCENE.enemyRespawnDelay,
      pos: pos.clone(),
    });
  }

  /**
   * Her frame cagrilir — zamanlayicilari guncelle, suresi dolanlari respawn et.
   */
  public update(dt: number): void {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].timer -= dt;
      if (this.timers[i].timer <= 0) {
        const { enemy, pos } = this.timers[i];
        enemy.respawn(pos);
        if (this.onRespawnCb) this.onRespawnCb(enemy);
        this.timers.splice(i, 1);
      }
    }
  }

  public getPendingCount(): number {
    return this.timers.length;
  }

  public clear(): void {
    this.timers = [];
  }
}
