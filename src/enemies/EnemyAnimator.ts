import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import type { EnemyAnimState } from '../data/enemyModels';

const LOOP_ANIMS: ReadonlySet<EnemyAnimState> = new Set(['idle', 'walk', 'run']);

/**
 * Manages skeletal animations for enemy models.
 * Mirrors PlayerAnimator pattern — state-driven play/stop with loop/one-shot logic.
 */
export class EnemyAnimator {
  private animations: Map<EnemyAnimState, AnimationGroup> = new Map();
  private currentState: EnemyAnimState = 'idle';
  private isPlaying = false;

  /**
   * Register loaded AnimationGroups by matching GLB anim names via animMap.
   * @param groups — AnimationGroups from instantiateModelsToScene
   * @param animMap — per-model mapping: EnemyAnimState → GLB animation name
   */
  public registerAnimations(
    groups: AnimationGroup[],
    animMap: Partial<Record<EnemyAnimState, string>>,
  ): void {
    for (const [state, glbName] of Object.entries(animMap)) {
      if (!glbName) continue;
      // instantiateModelsToScene sonrasi animasyon adlari:
      // "{typeKey}_CharacterArmature|{AnimName}_{timestamp}" formatinda
      // "|" sonrasi parcayi alip, glbName ile baslangiç kontrolu yap
      const group = groups.find(g => {
        if (g.name === glbName) return true;
        const afterPipe = g.name.includes('|') ? g.name.split('|').pop() ?? '' : g.name;
        // "Death_1775946241762" -> "Death" ile startsWith
        return afterPipe.startsWith(glbName);
      });
      if (group) {
        group.stop();
        this.animations.set(state as EnemyAnimState, group);
      }
    }
  }

  /** Start the default idle animation */
  public startIdle(): void {
    this.play('idle');
  }

  /** Transition to a new animation state */
  public play(state: EnemyAnimState, speedRatio = 1.0): void {
    if (state === this.currentState && this.isPlaying) return;

    // Stop current
    const current = this.animations.get(this.currentState);
    if (current) {
      current.stop();
    }

    // Play new
    const next = this.animations.get(state);
    if (next) {
      const loop = LOOP_ANIMS.has(state);
      next.speedRatio = speedRatio;
      next.start(loop, speedRatio);

      if (!loop) {
        next.onAnimationGroupEndObservable.addOnce(() => {
          this.isPlaying = false;
          // Return to idle after one-shot (death haric)
          if (state !== 'death') {
            this.play('idle');
          }
        });
      }

      this.currentState = state;
      this.isPlaying = true;
    }
  }

  /** Get the death animation duration in seconds (for syncing deathTimer) */
  public getDeathDuration(): number {
    const deathAnim = this.animations.get('death');
    if (!deathAnim) return 0;
    return (deathAnim.to - deathAnim.from) / deathAnim.targetedAnimations[0]?.animation.framePerSecond || 3;
  }

  /** Debug: hangi state'ler kayitli */
  public getRegisteredStates(): string[] {
    return Array.from(this.animations.keys());
  }

  public getCurrentState(): EnemyAnimState { return this.currentState; }
  public getIsPlaying(): boolean { return this.isPlaying; }

  public dispose(): void {
    for (const group of this.animations.values()) {
      group.dispose();
    }
    this.animations.clear();
  }
}
