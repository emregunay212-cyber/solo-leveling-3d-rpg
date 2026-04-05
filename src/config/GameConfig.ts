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
    { damageMultiplier: 1.0, duration: 0.35, window: 0.5 },
    { damageMultiplier: 1.2, duration: 0.35, window: 0.5 },
    { damageMultiplier: 1.8, duration: 0.5,  window: 0.0 },
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
  shadowBlade: {
    id: 'shadowBlade',
    name: 'Golge Bicagi',
    key: 'KeyQ',
    mpCost: 15,
    cooldown: 3,
    duration: 0.2,
    range: 6,
    damageMultiplier: 1.5,
    scaleStat: 'str' as const,
    type: 'dash' as const,
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
  craftRatio: 3,
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
