/**
 * Enemy typeKey → GLB model mapping.
 * EnemyDef degistirilmez — model bilgisi ayri dosyada tutulur.
 * Eslestirmesi olmayan dusmanlar kapsul fallback kullanir.
 *
 * Kaynak: Quaternius Ultimate Monsters Pack (CC0)
 * Indirildi: Poly Pizza CDN (https://poly.pizza)
 *
 * Animasyon tipleri (instantiateModelsToScene sonrasi format):
 *   "{typeKey}_CharacterArmature|{AnimName}_{timestamp}"
 *   Matching: "|" sonrasi parcayi alip startsWith ile karsilastir
 *
 *   Humanoid: Idle, Walk, Run, Punch, Death, HitReact
 *   Flying:   Flying_Idle, Fast_Flying, Headbutt/Punch, Death, HitReact
 *   Beast:    Idle, Walk, Bite_Front, Death, HitRecieve
 *   Goblin:   Idle, Walk, Run, Attack, Death, HitRecieve
 */

export type EnemyAnimState = 'idle' | 'walk' | 'run' | 'attack' | 'death' | 'hitReact';

export interface EnemyModelConfig {
  /** GLB dosya adi — ENEMY_MODEL.modelsPath altinda aranir */
  glbFile: string;
  /** Model olcegi — def.scale ile carpilir */
  modelScale: number;
  /** Zemin hizalama ofseti */
  yOffset: number;
  /** AI state → GLB animasyon adi eslestirmesi */
  animMap: Partial<Record<EnemyAnimState, string>>;
}

// ─── Aktif model mapping — tek tek eklenir, onaylandikca ───

export const ENEMY_MODEL_MAP: Readonly<Record<string, EnemyModelConfig>> = {
  // ─── E-RANK ───
  goblin: {
    glbFile: 'Goblin.glb',
    modelScale: 0.65,
    yOffset: 0,
    animMap: {
      idle: 'Idle',
      walk: 'Walk',
      run: 'Run',
      attack: 'Attack',
      death: 'Death',
      hitReact: 'HitRecieve',
    },
  },

  // Diger modeller tek tek eklenecek — simdilik capsule fallback
};
