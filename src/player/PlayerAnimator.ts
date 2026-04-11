import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';

export type AnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack1'
  | 'attack2'
  | 'attack3'
  | 'attack4'
  | 'dash'
  | 'block'
  | 'death'
  | 'hitReact'
  | 'skillCast';

const LOOP_ANIMS: ReadonlySet<AnimState> = new Set(['idle', 'walk', 'run', 'block']);

const ANIM_NAME_MAP: Record<AnimState, string> = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  attack1: 'Attack1',
  attack2: 'Attack2',
  attack3: 'Attack3',
  attack4: 'Attack4',
  dash: 'Dash',
  block: 'Block',
  death: 'Death',
  hitReact: 'HitReact',
  skillCast: 'SkillCast',
};

/**
 * Manages skeletal animations for the player character.
 * Plays/blends AnimationGroups loaded from the GLB file.
 */
export class PlayerAnimator {
  private animations: Map<AnimState, AnimationGroup> = new Map();
  private currentState: AnimState = 'idle';
  private isPlaying = false;

  /** Register loaded AnimationGroups by matching names */
  public registerAnimations(groups: AnimationGroup[]): void {
    for (const [state, glbName] of Object.entries(ANIM_NAME_MAP)) {
      const group = groups.find(g => g.name === glbName || g.name.startsWith(glbName));
      if (group) {
        group.stop();
        this.animations.set(state as AnimState, group);
      }
    }
  }

  /** Start the default idle animation */
  public startIdle(): void {
    this.play('idle');
  }

  /** Transition to a new animation state */
  public play(state: AnimState, speedRatio = 1.0): void {
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
          // Return to idle after one-shot animations
          if (state !== 'death') {
            this.play('idle');
          }
        });
      }

      this.currentState = state;
      this.isPlaying = true;
    }
  }

  /** Play attack animation based on combo index (0-3) */
  public playAttack(comboIndex: number, speedMult = 1.0): void {
    const states: AnimState[] = ['attack1', 'attack2', 'attack3', 'attack4'];
    const state = states[Math.min(comboIndex, 3)];
    this.play(state, speedMult);
  }

  /** Update animation based on movement state */
  public updateMovement(speed: number, isSprinting: boolean, isBlocking: boolean): void {
    // Don't interrupt one-shot animations
    if (this.isPlayingOneShot()) return;

    if (isBlocking) {
      this.play('block');
    } else if (speed > 0.1) {
      this.play(isSprinting ? 'run' : 'walk');
    } else {
      this.play('idle');
    }
  }

  private isPlayingOneShot(): boolean {
    if (!this.isPlaying) return false;
    return !LOOP_ANIMS.has(this.currentState);
  }

  public getCurrentState(): AnimState { return this.currentState; }
  public getIsPlaying(): boolean { return this.isPlaying; }

  public dispose(): void {
    for (const group of this.animations.values()) {
      group.dispose();
    }
    this.animations.clear();
  }
}
