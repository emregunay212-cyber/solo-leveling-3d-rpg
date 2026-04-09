import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Enemy } from '../enemies/Enemy';
import type { ShadowRank } from '../shadows/ShadowEnhancementTypes';
import type { ShadowCombatMode } from '../shadows/ShadowAI';
import type { DungeonRank, DungeonRewards, PlayerRank } from '../dungeon/types';

/**
 * Oyun olay tanimlari.
 * Tum event tipleri burada tanimlanir — string key hatalarini onler.
 * Ekipman olaylari kaldirildi — golgeler artik sabit yetenekler kullanir.
 */
export interface GameEvents {
  'enemy:death': { enemy: Enemy; xpReward: number; goldReward: number };
  'enemy:spawn': { enemy: Enemy; position: Vector3 };
  'player:damage': { amount: number; type: 'normal' | 'block' | 'parry' | 'backstab' };
  'player:death': { position: Vector3 };
  'player:respawn': { position: Vector3 };
  'player:levelUp': { level: number };
  'player:xpGain': { amount: number };
  'combat:hit': { damage: number; isCritical: boolean; targetPos: Vector3 };
  'combat:combo': { index: number; isFinisher: boolean };
  'skill:cast': { skillId: string; mpCost: number };
  'skill:hit': { skillId: string; damage: number; targetCount: number };
  'skill:upgraded': { skillId: string; newLevel: number };
  'shadow:extracted': { shadowType: string; name: string };
  'shadow:defeated': { shadowType: string };
  'shadow:failed': { reason: string };
  'stat:changed': Record<string, never>;
  'shadow:rankUp': { shadowUid: number; newRank: ShadowRank; rankName: string };
  'loot:drop': { itemId: string; itemType: 'skillbook'; enemyName: string };
  'shadow:modeChanged': { mode: ShadowCombatMode };
  'dungeon:enter': { rank: DungeonRank };
  'dungeon:exit': { rank: DungeonRank; completed: boolean; rewards: DungeonRewards };
  'dungeon:bossSpawn': { bossType: string };
  'dungeon:bossDeath': { bossType: string };
  'dungeon:waveCleared': { remaining: number };
  'player:rankChanged': { oldRank: PlayerRank; newRank: PlayerRank };

  // ─── Charge Sistemi ───
  'charge:start':   { skillId: string };
  'charge:level':   { skillId: string; level: string };
  'charge:release': { skillId: string; level: string };
  'charge:cancel':  { skillId: string };

  // ─── Combo Zinciri ───
  'combo:chain':  { name: string; from: string; to: string; bonus: number };
  'combo:streak': { count: number };

  // ─── Parry ───
  'parry:success': { reflectedDamage: number; stunDuration?: number };

  // ─── Arise ───
  'arise:attempt': { position: { x: number; y: number; z: number } };
  'arise:success': { shadowType: string };
  'arise:fail':    { reason: string };

  // ─── Slow Motion ───
  'slowmo:start': { scale: number; duration: number };
  'slowmo:end':   Record<string, never>;
}

type EventCallback<T> = (data: T) => void;

/**
 * Tipli pub/sub olay sistemi.
 * Generic tipler sayesinde event payload'lari derleme zamaninda kontrol edilir.
 */
export class EventBus {
  private listeners = new Map<string, Set<EventCallback<unknown>>>();

  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  once<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    const wrapper = ((data: GameEvents[K]) => {
      callback(data);
      this.off(event, wrapper);
    }) as EventCallback<GameEvents[K]>;
    this.on(event, wrapper);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
