/**
 * Merkezi oyun konfigurasyonu.
 * Tum oyun dengesi, hareket, savas ve ilerleme parametreleri burada.
 * Hardcoded deger YASAK — yeni sabitler buraya eklenmeli.
 */

// ─── OYUNCU ───
export const PLAYER = {
  walkSpeed: 5,
  sprintSpeed: 9,
  height: 1.8,
  radius: 0.35,
  rotationLerp: 0.15,
  blockSpeedMultiplier: 0.4,
  groundNormalThreshold: 0.7,
} as const;

// ─── KAMERA ───
export const CAMERA = {
  rotationSpeed: 0.005,
  zoomSpeed: 0.5,
  heightOffset: 1.5,
  minRadius: 3,
  maxRadius: 15,
  minBeta: 0.3,
  maxBeta: 1.4,
  dragThresholdPixels: 5,
  initialAlpha: -Math.PI / 2,
  initialBeta: Math.PI / 3.5,
  initialRadius: 8,
} as const;

// ─── SAVAS ───
export const COMBAT = {
  attackRange: 4.0,
  attackAngle: Math.PI * 0.5,       // 90° koni
  critChance: 0.15,
  critMultiplier: 2.0,
  damageVarianceMin: 0.85,
  damageVarianceRange: 0.3,         // 85%-115%
  facingHalfAngle: Math.PI / 3,     // 60° her yana
  behindDotThreshold: -0.3,
  autoAttackRange: 3.5,
  basePlayerDamage: 25,
  doubleClickTime: 0.4,
  backstabMultiplier: 1.5,
  parryPenaltyWhileAttacking: 0.5,
} as const;

// ─── COMBO ───
export const COMBO = {
  hits: [
    { damageMultiplier: 1.0, duration: 0.35, window: 0.5, aoeRadius: 0 },
    { damageMultiplier: 1.2, duration: 0.35, window: 0.5, aoeRadius: 0 },
    { damageMultiplier: 1.8, duration: 0.5,  window: 0.6, aoeRadius: 0 },
    { damageMultiplier: 2.2, duration: 0.6,  window: 0.0, aoeRadius: 2.5 }, // 4. vuruş: 360° AoE finisher
  ],
  cooldownBuffer: 0.05,
  finisherCooldownBuffer: 0.3,
  minAttackSpeedMultiplier: 0.5,
} as const;

// ─── HASAR SAYILARI ───
export const DAMAGE_NUMBERS = {
  maxPoolSize: 30,
  floatSpeed: 2.5,
  lifetime: 0.8,
  spreadRange: 0.5,
  velocityDeceleration: 0.95,
  fadeStartPercent: 0.7,
  types: {
    normal:      { color: '#FFFFFF', fontSize: 54, scale: 0.8 },
    critical:    { color: '#FFD700', fontSize: 72, scale: 1.2 },
    player_hurt: { color: '#FF4444', fontSize: 60, scale: 0.9 },
    parry:       { color: '#44FF44', fontSize: 66, scale: 1.1 },
    block:       { color: '#4488FF', fontSize: 58, scale: 0.9 },
    backstab:    { color: '#FF8800', fontSize: 68, scale: 1.1 },
    skill:       { color: '#A855F7', fontSize: 64, scale: 1.0 },
    arise:       { color: '#C084FC', fontSize: 78, scale: 1.4 },
    extract_fail:{ color: '#888888', fontSize: 54, scale: 0.8 },
  },
} as const;

// ─── DUSMAN AI ───
export const ENEMY_AI = {
  detectionRange: 10,
  attackRange: 2.5,
  leashRange: 20,
  chaseSpeed: 3.5,
  patrolSpeed: 1.5,
  attackCooldown: 1.8,
  patrolRadius: 5,
  patrolWaitMin: 2,
  patrolWaitMax: 5,
  patrolTargetThreshold: 0.5,
  spawnReturnThreshold: 1,
  attackRangeEscapeMultiplier: 1.5,
  detectionReturnMultiplier: 0.7,
} as const;

// ─── DUSMAN GORSEL ───
export const ENEMY_VISUAL = {
  bodyHeightMultiplier: 1.8,
  bodyRadiusMultiplier: 0.35,
  meshYOffsetMultiplier: 0.9,
  hpBarWidth: 1.0,
  hpBarHeight: 0.1,
  hpBarYOffsetMultiplier: 1.2,
  hitFlashDuration: 0.1,
  knockbackDistance: 0.4,
  hpColorThresholds: { yellow: 0.5, red: 0.25 },
  deathOpacity: 0.4,
  deathScale: 0.6,
  deathTimer: 3,
} as const;

// ─── ILERLEME / SEVIYE ───
export const LEVEL_SYSTEM = {
  maxLevel: 100,
  initialStats: { str: 5, vit: 5, agi: 5, int: 5 },
  statPointsPerLevel: 5,
  autoStatIncreasePerLevel: 1,
  statCap: 90,

  // Turetilmis stat formulleri: { base, multiplier, cap }
  maxHp:        { base: 80,   multiplier: 8,     cap: 800 },
  maxMp:        { base: 30,   multiplier: 5,     cap: 480 },
  attackDamage: { base: 10,   multiplier: 2,     cap: 190 },
  critChance:   { base: 0.05, multiplier: 0.005, cap: 0.40 },
  attackSpeed:  { base: 1.0,  multiplier: 0.02,  cap: 2.0 },
  moveSpeed:    { base: 5,    multiplier: 0.05,  cap: 8.0 },

  // Savunma
  defense:        { base: 2,    multiplier: 1.5,   cap: 150 },
  parryChance:    { base: 0.10, multiplier: 0.004, cap: 0.46 },
  blockReduction: { base: 0.30, multiplier: 0.004, cap: 0.70 },
  damageReductionDenominator: 100,

  // XP
  xpCurve: { baseMultiplier: 80, levelMultiplier: 25, growthFactor: 2.5 },
  deathPenaltyPercent: 0.05,
} as const;

// ─── SAHNE ───
export const SCENE = {
  groundSize: 100,
  groundSubdivisions: 20,
  gridSpacing: 10,
  gridRange: 40,
  enemyRespawnDelay: 15,
  portalRotationSpeed: 0.5,
  portalBobAmplitude: 0.1,

  spawns: {
    goblin:      [{ x: 6, z: 6 }, { x: 8, z: 4 }, { x: 5, z: 9 }],
    wolf:        [{ x: -8, z: 8 }, { x: -10, z: 6 }, { x: -7, z: 11 }],
    orc:         [{ x: 15, z: 15 }, { x: 18, z: 13 }],
    skeleton:    [{ x: -15, z: -10 }, { x: -13, z: -13 }, { x: -17, z: -8 }],
    darkKnight:  [{ x: 0, z: 25 }],
    demon:       [{ x: -20, z: 20 }],
  },

  obstacles: [
    { x: 12, height: 1, z: 12 },
    { x: -15, height: 2, z: 5 },
    { x: 20, height: 1.5, z: -10 },
  ],
} as const;

// ─── MOTOR ───
export const ENGINE = {
  clearColor: { r: 0.05, g: 0.05, b: 0.1 },
  ambientColor: { r: 0.1, g: 0.1, b: 0.15 },
  fog: { density: 0.002, color: { r: 0.05, g: 0.05, b: 0.1 } },
  gravity: -9.81,
  ambientLight: {
    intensity: 0.5,
    diffuse: { r: 0.8, g: 0.8, b: 0.9 },
    groundColor: { r: 0.2, g: 0.2, b: 0.3 },
  },
  sunLight: {
    direction: { x: -1, y: -2, z: -1 },
    intensity: 0.8,
    diffuse: { r: 1, g: 0.95, b: 0.85 },
  },
} as const;

// ─── YETENEKLER ───
export const SKILLS = {
  phantomStrike: {
    id: 'phantomStrike',
    name: 'Fantom Saldiri',
    key: 'KeyQ',
    mpCost: 15,
    cooldown: 4,
    duration: 0.4,
    range: 5,
    damageMultiplier: 1.0,
    scaleStat: 'str' as const,
    type: 'dash' as const,
    iframeDuration: 0.2,
    castLockDuration: 0.4,
    rank: 'E' as const,
    power: 5,
  },
  shadowShield: {
    id: 'shadowShield',
    name: 'Golge Kalkani',
    key: 'KeyE',
    mpCost: 25,
    cooldown: 10,
    duration: 5,
    range: 0,
    damageMultiplier: 0,
    scaleStat: 'int' as const,
    type: 'buff' as const,
    damageReduction: 0.6,
    rank: 'E' as const,
    power: 5,
  },
  shadowBurst: {
    id: 'shadowBurst',
    name: 'Golge Patlama',
    key: 'KeyR',
    mpCost: 40,
    cooldown: 8,
    duration: 0,
    range: 6,
    damageMultiplier: 3,
    scaleStat: 'int' as const,
    type: 'aoe' as const,
    rank: 'D' as const,
    power: 10,
  },
  sovereignAura: {
    id: 'sovereignAura',
    name: 'Hukumdar Aurasi',
    key: 'KeyF',
    mpCost: 80,
    cooldown: 30,
    duration: 0,
    range: 8,
    damageMultiplier: 5,
    scaleStat: 'int' as const,
    type: 'ultimate' as const,
    slowMultiplier: 0.5,
    slowDuration: 3,
    rank: 'C' as const,
    power: 20,
  },
} as const;

export const MP = {
  regenBase: 1,
  regenPerInt: 0.15,     // INT basina MP/sn (eskiden 0.1, arttirildi)
  regenInterval: 1,      // saniye
} as const;

// ─── GOLGE ORDUSU ───
export const SHADOW = {
  // Golge limiti KALDIRILDI — istedigin kadar cagir, bedeli MP/HP ile ode
  extractionChance: 0.60,
  extractionIntBonus: 0.003,
  shadowDamageMultiplier: 0.8,
  shadowHpMultiplier: 0.6,
  shadowScale: 0.9,
  followDistance: 3,
  chaseRange: 8,
  attackRange: 2.5,
  leashRange: 15,
  attackCooldown: 2.0,
  patrolSpeed: 2.0,
  chaseSpeed: 4.0,

  // Mana drain: seviye farkina bagli dinamik maliyet
  manaDrainBase: 1,           // baz MP/sn (her golge icin minimum)
  manaDrainPerEnemyLevel: 0.5,// dusman seviyesi basina ek MP/sn
  manaDrainLevelReduction: 0.3,// oyuncu seviyesi basina azalma MP/sn
  manaDrainMin: 0.5,          // minimum drain (cok zayif golge bile biraz harcar)
  manaDrainInterval: 1,       // drain hesaplama araligi (sn)
  hpDrainPerSecond: 3,        // mana bitince golge basina saniyede HP kaybi

  // Stok iyilesme: envanterdeki golgeler yavasce iyilesir
  stockHealPercent: 0.05,     // saniyede max HP'nin %5'i kadar iyilesir
  stockHealInterval: 2,       // iyilesme araligi (sn)

  threatSearchRange: 3,       // golgeye vurulunca yakin golge arama mesafesi
  summonOffsetDistance: 2,    // stoktan cagirma: oyuncunun arkasinda spawn mesafesi
  threatDuration: 5,          // dusmanin golgeye odaklanma suresi (sn)
  color: { r: 0.15, g: 0.05, b: 0.25 },
  emissive: { r: 0.3, g: 0.1, b: 0.5 },
  alpha: 0.85,
  hpBarColor: { r: 0.4, g: 0.1, b: 0.6 },
} as const;

// ─── DUNGEON SISTEMI ───
export const DUNGEON = {
  ranks: ['E', 'D', 'C', 'B', 'A', 'S'] as const,
  maxRankAbove: 2,
  gateProximityRadius: 3,
  bossSpawnDelay: 3,
  arenaSize: { E: 40, D: 45, C: 50, B: 55, A: 60, S: 70 },
  statMultiplier: { E: 1, D: 1.5, C: 2.5, B: 4, A: 6, S: 10 },
  enemyCount: { E: 8, D: 10, C: 12, B: 14, A: 16, S: 20 },
  bossHpMultiplier: 8,
  bossDamageMultiplier: 4,
  recommendedLevel: { E: 1, D: 5, C: 10, B: 20, A: 35, S: 60 },
  rewards: {
    xpMultiplier: { E: 1, D: 2, C: 3, B: 5, A: 8, S: 15 },
    goldMultiplier: { E: 1, D: 2, C: 4, B: 7, A: 12, S: 20 },
  },
  deathPenalty: {
    xpLossPercent: 0.35,
    itemLossChance: 0.3,
    canLevelDown: true,
  },
  cityRespawnLosesAll: true,
  cooldownMinutes: { E: 30, D: 45, C: 60, B: 90, A: 120, S: 180 },
} as const;

// ─── OYUNCU RANK SISTEMI ───
export const PLAYER_RANK = {
  ranks: ['none', 'E', 'D', 'C', 'B', 'A', 'S'] as const,
  skillPowerThresholds: { E: 10, D: 30, C: 60, B: 100, A: 150, S: 250 },
} as const;

// ─── GOLGE GELISTIRME ───
export const SHADOW_ENHANCEMENT = {
  normalStatPercent: 0.15,    // normal golgeler oyuncu statlarinin %15'ini kopyalar
  bossBaseStatPercent: 0.25,  // boss golgelerin baz yuzdesi %25
  ranks: [
    { rank: 'soldier', name: 'Asker', requiredKills: 0, statPercent: 0.25 },
    { rank: 'knight', name: 'Sovalye', requiredKills: 15, statPercent: 0.30 },
    { rank: 'elite', name: 'Elit', requiredKills: 50, statPercent: 0.35 },
    { rank: 'commander', name: 'Komutan', requiredKills: 150, statPercent: 0.40 },
  ],
} as const;

// ─── CHARGE SISTEMI ───
export const CHARGE = {
  defaultLv1Threshold: 0.3,
  defaultMaxThreshold: 2.0,
} as const;

// ─── SKILL CHARGE KONFIGURASYONLARI ───
export const SKILL_CHARGE: Record<string, import('../skills/SkillDef').SkillChargeConfig> = {
  phantomStrike: {
    lv1Threshold: 0.3, maxThreshold: 2.0,
    canMoveWhileCharging: true, moveSpeedMultiplier: 0.5,
    tap:  { range: 5, damageMult: 1.0, mpCost: 15, extra: 'hits:3' },
    lv1:  { range: 7, damageMult: 1.2, mpCost: 22, extra: 'hits:5,knockback' },
    max:  { range: 9, damageMult: 1.5, mpCost: 35, extra: 'hits:7,aoe_burst,slowmo' },
  },
  shadowShield: {
    lv1Threshold: 0.3, maxThreshold: 2.0,
    canMoveWhileCharging: true, moveSpeedMultiplier: 1.0,
    tap:  { range: 0, damageMult: 0, mpCost: 25, duration: 3,  damageReduction: 0.6, parryWindow: 0.4 },
    lv1:  { range: 0, damageMult: 0, mpCost: 35, duration: 5,  damageReduction: 0.6, parryWindow: 0.6 },
    max:  { range: 0, damageMult: 0, mpCost: 50, duration: 8,  damageReduction: 0.8, parryWindow: 1.0, extra: 'burst_on_break' },
  },
  shadowBurst: {
    lv1Threshold: 0.3, maxThreshold: 2.0,
    canMoveWhileCharging: true, moveSpeedMultiplier: 0.5,
    tap:  { range: 4,  damageMult: 3.0, mpCost: 40 },
    lv1:  { range: 6,  damageMult: 4.5, mpCost: 55 },
    max:  { range: 9,  damageMult: 7.0, mpCost: 75, extra: '3x_explosion' },
  },
  sovereignAura: {
    lv1Threshold: 0.5, maxThreshold: 2.0,
    canMoveWhileCharging: false, moveSpeedMultiplier: 0.0,
    tap:  { range: 8,  damageMult: 5.0, mpCost: 80 },
    lv1:  { range: 8,  damageMult: 5.0, mpCost: 80 },
    max:  { range: 14, damageMult: 9.0, mpCost: 120, extra: 'cinematic+arise' },
  },
  // Boss skill'ler (tam charge yok, sadece tap/tap+bonus)
  skill_flame_burst: {
    lv1Threshold: 0.5, maxThreshold: 1.5,
    canMoveWhileCharging: true, moveSpeedMultiplier: 0.8,
    tap:  { range: 3, damageMult: 2.5, mpCost: 30 },
    lv1:  { range: 4, damageMult: 3.5, mpCost: 40 },
    max:  { range: 5, damageMult: 4.5, mpCost: 50, extra: 'dot' },
  },
  skill_lightning_chain: {
    lv1Threshold: 0.5, maxThreshold: 1.5,
    canMoveWhileCharging: true, moveSpeedMultiplier: 1.0,
    tap:  { range: 12, damageMult: 2.0, mpCost: 35 },
    lv1:  { range: 12, damageMult: 2.8, mpCost: 45 },
    max:  { range: 15, damageMult: 3.5, mpCost: 55, extra: '6_jumps' },
  },
  skill_ice_prison: {
    lv1Threshold: 0.5, maxThreshold: 1.5,
    canMoveWhileCharging: true, moveSpeedMultiplier: 0.7,
    tap:  { range: 4, damageMult: 1.5, mpCost: 45 },
    lv1:  { range: 5, damageMult: 2.0, mpCost: 55 },
    max:  { range: 7, damageMult: 2.5, mpCost: 70, extra: 'burst_on_break' },
  },
  skill_blood_rage: {
    lv1Threshold: 0.5, maxThreshold: 1.5,
    canMoveWhileCharging: true, moveSpeedMultiplier: 1.0,
    tap:  { range: 0, damageMult: 0, mpCost: 35, duration: 8 },
    lv1:  { range: 0, damageMult: 0, mpCost: 45, duration: 10 },
    max:  { range: 0, damageMult: 0, mpCost: 60, duration: 12, extra: 'lifesteal' },
  },
  skill_shadow_domain: {
    lv1Threshold: 0.5, maxThreshold: 2.0,
    canMoveWhileCharging: false, moveSpeedMultiplier: 0.0,
    tap:  { range: 18, damageMult: 6.0, mpCost: 100 },
    lv1:  { range: 18, damageMult: 6.0, mpCost: 100 },
    max:  { range: 18, damageMult: 6.0, mpCost: 100, extra: 'cinematic' },
  },
  skill_void_strike: {
    lv1Threshold: 0.5, maxThreshold: 1.5,
    canMoveWhileCharging: true, moveSpeedMultiplier: 0.7,
    tap:  { range: 12, damageMult: 4.0, mpCost: 50 },
    lv1:  { range: 16, damageMult: 5.5, mpCost: 65 },
    max:  { range: 20, damageMult: 7.0, mpCost: 80, extra: 'blind_trail' },
  },
};

// ─── COMBO ZINCIR SISTEMI ───
export const COMBO_CHAIN = {
  windowDuration: 1.5,   // saniye
  streakDecay: 3.0,      // streak sifirlanma suresi
} as const;

// ─── PARRY ───
export const PARRY_CONFIG = {
  defaultWindow: 0.4,
  defaultStun: 0.5,
  defaultReflect: 0.3,
} as const;

// ─── ARISE SISTEMI ───
export const ARISE = {
  baseChance: 0.6,
  intBonusPerPoint: 0.005,
  holdDuration: 1.0,
  bossHoldDuration: 2.0,
  bossBaseChance: 0.4,
  corpseExpireTime: 15,
  promptRadius: 3.5,     // Bu mesafeye girince E-Arise prompt gorunur
} as const;

// ─── SLOW MOTION ───
export const SLOW_MOTION = {
  parryScale: 0.3,
  parryDuration: 0.15,
  dashMaxScale: 0.3,
  dashMaxDuration: 0.1,
  ultimateScale: 0.2,
  ultimateDuration: 0.2,
  comboHit4Scale: 0.3,
  comboHit4Duration: 0.05,
  domainScale: 0.2,
  domainDuration: 0.3,
} as const;

// ─── UI ───
export const UI = {
  clickIndicator: {
    maxAge: 0.6,
    initialScale: 0.1,
    maxScaleExpansion: 2.0,
    yOffset: 0.05,
    color: { r: 0.5, g: 0.3, b: 1.0 },
    emissive: { r: 0.3, g: 0.15, b: 0.7 },
    alpha: 0.8,
  },
} as const;
