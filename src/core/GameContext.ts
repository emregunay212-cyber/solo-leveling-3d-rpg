import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/**
 * Merkezi oyun durumu.
 * Her frame guncellenir ve tum sistemlere iletilir.
 * Dagitik parametreleri tek bir yerde toplar.
 */
export interface GameContext {
  /** Frame delta time (saniye, clamp: 0.001-0.05) */
  deltaTime: number;
  /** Oyun baslangicından gecen sure (saniye) */
  timestamp: number;

  /** Oyuncu durumu */
  player: PlayerState;
}

export interface PlayerState {
  position: Vector3;
  rotationY: number;
  isAlive: boolean;
  isBlocking: boolean;
  isAttacking: boolean;
  hp: number;
  maxHp: number;
}

/**
 * Her frame GameContext'i guncelle.
 * TestScene.onUpdate icinden cagirilir.
 */
export function createGameContext(
  dt: number,
  playerPos: Vector3,
  playerRotY: number,
  playerAlive: boolean,
  playerBlocking: boolean,
  playerAttacking: boolean,
  playerHp: number,
  playerMaxHp: number,
): GameContext {
  return {
    deltaTime: dt,
    timestamp: Date.now() / 1000,
    player: {
      position: playerPos,
      rotationY: playerRotY,
      isAlive: playerAlive,
      isBlocking: playerBlocking,
      isAttacking: playerAttacking,
      hp: playerHp,
      maxHp: playerMaxHp,
    },
  };
}
