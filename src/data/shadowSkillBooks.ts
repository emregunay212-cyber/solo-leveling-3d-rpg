/**
 * Golge Yetenek Tanimlari
 * A) Dusman-icerik yetenekler: golge askerleri otomatik kullanir
 * B) Oyuncu yetenek kitaplari: dusmanlardan duser, oyuncunun Q/E/R/F'ini guclendirir
 */

import type { ShadowSkillDef } from '../shadows/ShadowEnhancementTypes';

// ─── A) DUSMAN-ICERIK YETENEKLER (golge askerleri icin) ───

const enemy_fast_attack: ShadowSkillDef = {
  id: 'enemy_fast_attack',
  name: 'Hizli Saldiri',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Saldiri hizi %30 artar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusAttackSpeed: 0.6 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_pack_bonus: ShadowSkillDef = {
  id: 'enemy_pack_bonus',
  name: 'Suru Gucu',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Yakin golge varsa +%15 hasar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.15 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_poison_strike: ShadowSkillDef = {
  id: 'enemy_poison_strike',
  name: 'Zehirli Darbe',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Zehirli saldiri: +%30 hasar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.3 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_heavy_strike: ShadowSkillDef = {
  id: 'enemy_heavy_strike',
  name: 'Agir Darbe',
  type: 'passive',
  trigger: 'onAttack',
  description: '+%40 hasar ama yavas',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.4 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_tough_skin: ShadowSkillDef = {
  id: 'enemy_tough_skin',
  name: 'Sert Deri',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: '+10 savunma',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusDefense: 10 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_shield_block: ShadowSkillDef = {
  id: 'enemy_shield_block',
  name: 'Kalkan Blogu',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: '%20 sans ile hasari yariya indir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusBlockChance: 0.20 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_shadow_cleave: ShadowSkillDef = {
  id: 'enemy_shadow_cleave',
  name: 'Golge Bicak',
  type: 'passive',
  trigger: 'onAttack',
  description: 'AoE 3m saldiri',
  cooldown: 8,
  requiredLevel: 0,
  effect: { aoeRadius: 3, damageMultiplier: 1.5 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_lifesteal: ShadowSkillDef = {
  id: 'enemy_lifesteal',
  name: 'Can Emme',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Verilen hasarin %8i kadar iyiles',
  cooldown: 0,
  requiredLevel: 0,
  effect: { healPercent: 0.08 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_hellfire: ShadowSkillDef = {
  id: 'enemy_hellfire',
  name: 'Cehennem Atesi',
  type: 'passive',
  trigger: 'periodic',
  description: 'AoE ates hasari',
  cooldown: 6,
  requiredLevel: 0,
  effect: { aoeRadius: 4, damageMultiplier: 2.0 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_web_slow: ShadowSkillDef = {
  id: 'enemy_web_slow',
  name: 'Ag Yavaslatma',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Hedefi 3sn yavaslatir',
  cooldown: 6,
  requiredLevel: 0,
  effect: { durationSeconds: 3, statBuff: { bonusMoveSpeed: -2 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_swarm: ShadowSkillDef = {
  id: 'enemy_swarm',
  name: 'Suru Saldirisi',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Zayif ama surekli saldiri +%10 hasar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.1 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_frost_bite: ShadowSkillDef = {
  id: 'enemy_frost_bite',
  name: 'Buz Isirigi',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Hedefin saldiri hizini dusurur',
  cooldown: 5,
  requiredLevel: 0,
  effect: { durationSeconds: 4, statBuff: { bonusAttackSpeed: 0.5 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_frenzy: ShadowSkillDef = {
  id: 'enemy_frenzy',
  name: 'Cinnet',
  type: 'passive',
  trigger: 'onKill',
  description: 'Oldurme sonrasi 8sn +%30 hasar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { durationSeconds: 8, statBuff: { bonusDamagePercent: 0.3 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_dark_magic: ShadowSkillDef = {
  id: 'enemy_dark_magic',
  name: 'Karanlik Buyu',
  type: 'passive',
  trigger: 'onAttack',
  description: 'AoE karanlik buyu hasari',
  cooldown: 4,
  requiredLevel: 0,
  effect: { aoeRadius: 4, damageMultiplier: 1.8 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_fire_breath: ShadowSkillDef = {
  id: 'enemy_fire_breath',
  name: 'Ates Nefesi',
  type: 'passive',
  trigger: 'periodic',
  description: 'Genis alan ates nefesi',
  cooldown: 5,
  requiredLevel: 0,
  effect: { aoeRadius: 5, damageMultiplier: 2.5 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_summon_minion: ShadowSkillDef = {
  id: 'enemy_summon_minion',
  name: 'Usak Cagirma',
  type: 'passive',
  trigger: 'periodic',
  description: 'Usak cagirma (lezzetlik)',
  cooldown: 10,
  requiredLevel: 0,
  effect: { damageMultiplier: 0 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_triple_strike: ShadowSkillDef = {
  id: 'enemy_triple_strike',
  name: 'Uclu Vurus',
  type: 'passive',
  trigger: 'onAttack',
  description: '3 basli saldiri +%25 hasar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.25 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_shadow_clone: ShadowSkillDef = {
  id: 'enemy_shadow_clone',
  name: 'Golge Klonu',
  type: 'passive',
  trigger: 'periodic',
  description: 'Golge klonu olusturma (lezzetlik)',
  cooldown: 12,
  requiredLevel: 0,
  effect: { damageMultiplier: 0 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_drain_life: ShadowSkillDef = {
  id: 'enemy_drain_life',
  name: 'Hayat Emme',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Verilen hasarin %12si kadar iyiles',
  cooldown: 0,
  requiredLevel: 0,
  effect: { healPercent: 0.12 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

// ─── B) OYUNCU YETENEK KITAPLARI (drop olarak duser) ───

const book_shadow_blade_up: ShadowSkillDef = {
  id: 'book_shadow_blade_up',
  name: 'Golge Bicagi+',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Q yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.2 },
  buyPrice: 200,
  sellPrice: 80,
} as const;

const book_shadow_shield_up: ShadowSkillDef = {
  id: 'book_shadow_shield_up',
  name: 'Golge Kalkani+',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: 'E yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusDefense: 15 } },
  buyPrice: 300,
  sellPrice: 120,
} as const;

const book_shadow_burst_up: ShadowSkillDef = {
  id: 'book_shadow_burst_up',
  name: 'Golge Patlama+',
  type: 'passive',
  trigger: 'onAttack',
  description: 'R yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.3 },
  buyPrice: 0,
  sellPrice: 150,
} as const;

const book_sovereign_aura_up: ShadowSkillDef = {
  id: 'book_sovereign_aura_up',
  name: 'Hukumdar Aurasi+',
  type: 'passive',
  trigger: 'onAttack',
  description: 'F yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.5 },
  buyPrice: 0,
  sellPrice: 200,
} as const;

const book_dark_regen: ShadowSkillDef = {
  id: 'book_dark_regen',
  name: 'Karanlik Yenilenme',
  type: 'passive',
  trigger: 'periodic',
  description: 'Oyuncu HP yenilenmesini arttirir',
  cooldown: 5,
  requiredLevel: 0,
  effect: { healPercent: 0.03 },
  buyPrice: 150,
  sellPrice: 60,
} as const;

const book_iron_will: ShadowSkillDef = {
  id: 'book_iron_will',
  name: 'Demir Irade',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: 'Hasar azaltmayi arttirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusBlockChance: 0.15 } },
  buyPrice: 250,
  sellPrice: 100,
} as const;

// ─── C) BOSS DROP YETENEKLERI (ogrenilir, Q/E/R/F'e atanabilir) ───

const skill_flame_burst: ShadowSkillDef = {
  id: 'skill_flame_burst',
  name: 'Alev Patlamasi',
  type: 'active',
  trigger: 'manual',
  description: 'AoE ates hasari — B rank boss skill',
  cooldown: 6,
  requiredLevel: 15,
  effect: { aoeRadius: 5, damageMultiplier: 2.5 },
  buyPrice: 0,
  sellPrice: 400,
} as const;

const skill_ice_prison: ShadowSkillDef = {
  id: 'skill_ice_prison',
  name: 'Buz Hapishanesi',
  type: 'active',
  trigger: 'manual',
  description: 'Dusmanlari yavaslatir ve savunma arttirir — A rank boss skill',
  cooldown: 12,
  requiredLevel: 25,
  effect: { durationSeconds: 5, statBuff: { bonusDefense: 30 } },
  buyPrice: 0,
  sellPrice: 600,
} as const;

const skill_shadow_domain: ShadowSkillDef = {
  id: 'skill_shadow_domain',
  name: 'Golge Alani',
  type: 'active',
  trigger: 'manual',
  description: 'Devasa AoE golge hasari — S rank boss skill',
  cooldown: 30,
  requiredLevel: 40,
  effect: { aoeRadius: 8, damageMultiplier: 5.0 },
  buyPrice: 0,
  sellPrice: 1000,
} as const;

const skill_lightning_chain: ShadowSkillDef = {
  id: 'skill_lightning_chain',
  name: 'Yildirim Zinciri',
  type: 'active',
  trigger: 'manual',
  description: 'Sicrayan yildirim hasari — B rank boss skill',
  cooldown: 8,
  requiredLevel: 15,
  effect: { damageMultiplier: 2.0 },
  buyPrice: 0,
  sellPrice: 350,
} as const;

const skill_blood_rage: ShadowSkillDef = {
  id: 'skill_blood_rage',
  name: 'Kan Ofkesi',
  type: 'active',
  trigger: 'manual',
  description: 'Hasar arttirici buff + can emme — A rank boss skill',
  cooldown: 15,
  requiredLevel: 25,
  effect: { durationSeconds: 8, damageMultiplier: 1.8, healPercent: 0.10 },
  buyPrice: 0,
  sellPrice: 550,
} as const;

const skill_void_strike: ShadowSkillDef = {
  id: 'skill_void_strike',
  name: 'Bosluk Darbesi',
  type: 'active',
  trigger: 'manual',
  description: 'Tek hedefe devasa hasar — S rank boss skill',
  cooldown: 25,
  requiredLevel: 40,
  effect: { damageMultiplier: 6.0 },
  buyPrice: 0,
  sellPrice: 900,
} as const;

// ─── BOSS SKILL → SkillDef ESLESMESI (Q/E/R/F combat icin) ───

import type { SkillDef } from '../skills/SkillDef';

/**
 * Boss drop yeteneklerinin SkillDef uyumlu tanimlari.
 * SkillSystem tarafindan kullanilabilir — slot atamasi PlayerRankSystem uzerinden yapilir.
 */
export const BOSS_SKILL_DEFS: Readonly<Record<string, SkillDef>> = {
  skill_flame_burst: {
    id: 'skill_flame_burst',
    name: 'Alev Patlamasi',
    key: 'KeyQ',
    mpCost: 35,
    cooldown: 6,
    duration: 0,
    range: 5,
    damageMultiplier: 2.5,
    scaleStat: 'int',
    type: 'aoe',
    rank: 'B',
    power: 25,
  },
  skill_ice_prison: {
    id: 'skill_ice_prison',
    name: 'Buz Hapishanesi',
    key: 'KeyE',
    mpCost: 45,
    cooldown: 12,
    duration: 5,
    range: 0,
    damageMultiplier: 0,
    scaleStat: 'int',
    type: 'buff',
    damageReduction: 0.5,
    rank: 'A',
    power: 35,
  },
  skill_shadow_domain: {
    id: 'skill_shadow_domain',
    name: 'Golge Alani',
    key: 'KeyF',
    mpCost: 100,
    cooldown: 30,
    duration: 0,
    range: 8,
    damageMultiplier: 5.0,
    scaleStat: 'int',
    type: 'ultimate',
    slowMultiplier: 0.3,
    slowDuration: 4,
    rank: 'S',
    power: 50,
  },
  skill_lightning_chain: {
    id: 'skill_lightning_chain',
    name: 'Yildirim Zinciri',
    key: 'KeyR',
    mpCost: 30,
    cooldown: 8,
    duration: 0,
    range: 6,
    damageMultiplier: 2.0,
    scaleStat: 'int',
    type: 'aoe',
    rank: 'B',
    power: 20,
  },
  skill_blood_rage: {
    id: 'skill_blood_rage',
    name: 'Kan Ofkesi',
    key: 'KeyE',
    mpCost: 50,
    cooldown: 15,
    duration: 8,
    range: 0,
    damageMultiplier: 1.8,
    scaleStat: 'str',
    type: 'buff',
    damageReduction: 0.3,
    rank: 'A',
    power: 30,
  },
  skill_void_strike: {
    id: 'skill_void_strike',
    name: 'Bosluk Darbesi',
    key: 'KeyQ',
    mpCost: 60,
    cooldown: 25,
    duration: 0.3,
    range: 4,
    damageMultiplier: 6.0,
    scaleStat: 'str',
    type: 'dash',
    rank: 'S',
    power: 45,
  },
} as const;

// ─── KITAP → SKILL ESLESMESI ───

/** Hangi kitap hangi oyuncu yetenegini guclendirir (upgrade kitaplari) */
export const BOOK_TO_SKILL_MAP: Readonly<Record<string, string>> = {
  'book_shadow_blade_up': 'shadowBlade',
  'book_shadow_shield_up': 'shadowShield',
  'book_shadow_burst_up': 'shadowBurst',
  'book_sovereign_aura_up': 'sovereignAura',
  'book_dark_regen': 'passive_hp_regen',
  'book_iron_will': 'passive_damage_reduce',
  // Boss drop skill kitaplari — ogrenildiginde havuza eklenir
  'skill_flame_burst': 'skill_flame_burst',
  'skill_ice_prison': 'skill_ice_prison',
  'skill_shadow_domain': 'skill_shadow_domain',
  'skill_lightning_chain': 'skill_lightning_chain',
  'skill_blood_rage': 'skill_blood_rage',
  'skill_void_strike': 'skill_void_strike',
} as const;

/** Passive kitaplar — Q/E/R/F degilse passive buff olarak kullanilir */
export const PASSIVE_BOOK_IDS = new Set(['book_dark_regen', 'book_iron_will']);

/** Boss drop skill kitaplari — ogrenildiginde skill havuzuna eklenir */
export const BOSS_SKILL_BOOK_IDS = new Set([
  'skill_flame_burst',
  'skill_ice_prison',
  'skill_shadow_domain',
  'skill_lightning_chain',
  'skill_blood_rage',
  'skill_void_strike',
]);

/** Skill ID → skill display bilgisi (UI icin) */
export const SKILL_KEY_LABELS: Readonly<Record<string, string>> = {
  'shadowBlade': 'Q',
  'shadowShield': 'E',
  'shadowBurst': 'R',
  'sovereignAura': 'F',
  'passive_hp_regen': 'HP\u2191',
  'passive_damage_reduce': 'DEF\u2191',
} as const;

// ─── EXPORT ───

/** Dusman-icerik yetenekler — golge askerlerinin otomatik kullandigi */
export const ENEMY_SKILL_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  enemy_fast_attack,
  enemy_pack_bonus,
  enemy_poison_strike,
  enemy_heavy_strike,
  enemy_tough_skin,
  enemy_shield_block,
  enemy_shadow_cleave,
  enemy_lifesteal,
  enemy_hellfire,
  enemy_web_slow,
  enemy_swarm,
  enemy_frost_bite,
  enemy_frenzy,
  enemy_dark_magic,
  enemy_fire_breath,
  enemy_summon_minion,
  enemy_triple_strike,
  enemy_shadow_clone,
  enemy_drain_life,
} as const;

/** Oyuncu yetenek kitaplari — dusmanlardan duser, oyuncunun Q/E/R/F'ini guclendirir veya yeni yetenek ogretir */
export const PLAYER_SKILL_BOOK_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  // Upgrade kitaplari
  book_shadow_blade_up,
  book_shadow_shield_up,
  book_shadow_burst_up,
  book_sovereign_aura_up,
  book_dark_regen,
  book_iron_will,
  // Boss drop yetenekleri (ogrenilir, havuza eklenir)
  skill_flame_burst,
  skill_ice_prison,
  skill_shadow_domain,
  skill_lightning_chain,
  skill_blood_rage,
  skill_void_strike,
} as const;

/**
 * Tum skill tanimlari — hem dusman hem oyuncu.
 * ShadowSkillRunner ve diger sistemler tarafindan kullanilir.
 */
export const SKILL_BOOK_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  ...ENEMY_SKILL_DEFS,
  ...PLAYER_SKILL_BOOK_DEFS,
} as const;
