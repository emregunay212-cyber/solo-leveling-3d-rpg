# Solo Leveling — Yetenek Mekanik & VFX Tam Entegrasyon Plani

## Mevcut Durum Ozeti

### Var Olan Sistemler
- **SkillSystem**: 4 slot (Q/E/R/F), edge-detect input, cooldown, upgrade (0-5), basit cast
- **CombatSystem**: Melee range/angle check, crit, variance
- **ComboSystem**: 3-hit auto-attack zinciri (sadece normal saldiri)
- **SkillVFXManager**: ParticlePool, ScreenShake, LightFlash, Shockwave, GroundDecal, SlashEffect
- **12 Skill VFX dosyasi**: Tumu tek versiyon (Tap only)
- **EventBus**: skill:cast, skill:hit, combat:combo vb.
- **PlayerController**: WASD + dashTo() + blocking

### Eksik Olan Sistemler
- ChargeSystem (basili tutma)
- TargetingSystem (AoE daire + yon gostergesi)
- ComboChainSystem (skill-to-skill combo)
- SlowMotion (time scale)
- CinematicCamera (sinematik kamera sekans)
- AfterimageEffect (golge siluet)
- DissolveEffect (Void Strike kaybolma)
- ProjectileSystem (ates topu vb.)
- Perfect Parry mekaniigi
- 4. normal saldiri vurusu (bonus hit)
- Charge VFX varyasyonlari (Tap/Lv1/MAX)
- ComboUI, TargetingUI, AriseUI

---

## Bagimlilik Grafi

```
ChargeSystem ─────────────┐
                          ├──> SkillSystem (guncelle)
TargetingSystem ──────────┤
                          ├──> TestScene / DungeonScene (guncelle)
ComboChainSystem ─────────┘
                              │
SlowMotion ───────────────────┤
CinematicCamera ──────────────┤
AfterimageEffect ─────────────┤──> VFX Skill dosyalari (guncelle)
DissolveEffect ───────────────┤
ProjectileEffect ─────────────┘
                              │
ComboUI ──────────────────────┤
TargetingUI ──────────────────┤──> UI katmani
AriseUI ──────────────────────┘
```

---

## SPRINT 1: Charge Sistemi (Temel Altyapi)

### Amac
Tum yeteneklerde "basili tut = guclu versiyon" mekanigi.

### 1.1 — `src/skills/ChargeSystem.ts` (YENi)

**Sorumluluk:** Tus basili tutma suresi takibi + seviye hesaplama

```
Arayuz:
  ChargeLevel = 'tap' | 'lv1' | 'max'
  
  ChargeConfig {
    lv1Threshold: number    // 0.3sn (varsayilan)
    maxThreshold: number    // 2.0sn
    canMoveWhileCharging: boolean
    moveSpeedMultiplier: number  // 0.3 = %30 hiz
  }

  ChargeState {
    isCharging: boolean
    chargeTime: number
    level: ChargeLevel
    skillKey: string | null
  }

Metotlar:
  startCharge(key: string, config: ChargeConfig): void
  update(dt: number): ChargeState
  release(): { level: ChargeLevel, chargeTime: number }
  cancel(): void
  isCharging(): boolean
```

**Mantik:**
- `startCharge()` → InputManager'dan key DOWN alinca
- `update()` her frame chargeTime += dt, seviye esiklerini kontrol et
- `release()` → key UP alinca, mevcut seviyeyi don
- `cancel()` → sag tik ile iptal (MP harcanmaz)

**Dokumanla Esleme:**
| Yetenek | Lv1 Esik | MAX Esik | Hareket | Hiz |
|---------|----------|----------|---------|-----|
| Q Dash  | 0.3sn    | 2.0sn    | Yavaslamis | %30 |
| E Shield| 0.3sn    | 2.0sn    | TAM     | %100 |
| R Burst | 0.3sn    | 2.0sn    | Yavaslamis | %50 |
| F Aura  | -        | 2.0sn    | Kilitli | %0  |

### 1.2 — `src/skills/SkillDef.ts` (GUNCELLE)

**Eklenecek alanlar:**
```typescript
interface SkillDef {
  // ... mevcut alanlar ...
  
  // Charge parametreleri
  charge?: {
    lv1Threshold: number
    maxThreshold: number
    canMove: boolean
    moveSpeedMult: number
    // Seviye bazli degerler
    tap: { range: number, damage: number, mpCost: number, extra?: string }
    lv1: { range: number, damage: number, mpCost: number, extra?: string }
    max: { range: number, damage: number, mpCost: number, extra?: string }
  }
  
  // I-frame suresi
  iframeDuration?: number
  
  // Cast kilitleme suresi
  castLockDuration?: number
}
```

### 1.3 — `src/config/GameConfig.ts` (GUNCELLE)

**Her yetenek icin charge parametreleri eklenir:**

```typescript
SKILLS: {
  shadowBlade: {
    // mevcut...
    charge: {
      lv1Threshold: 0.3, maxThreshold: 2.0,
      canMove: true, moveSpeedMult: 0.3,
      tap:  { range: 6,  damage: 1.5, mpCost: 15 },
      lv1:  { range: 10, damage: 2.2, mpCost: 20 },
      max:  { range: 16, damage: 3.5, mpCost: 30 },
    },
    iframeDuration: 0.15,
  },
  shadowShield: {
    charge: {
      lv1Threshold: 0.3, maxThreshold: 2.0,
      canMove: true, moveSpeedMult: 1.0,
      tap:  { damageReduction: 0.6, duration: 3,  mpCost: 25, parryWindow: 0.4 },
      lv1:  { damageReduction: 0.6, duration: 5,  mpCost: 35, parryWindow: 0.6 },
      max:  { damageReduction: 0.8, duration: 8,  mpCost: 50, parryWindow: 1.0 },
    },
  },
  // ... R, F, boss skill'ler ...
}
```

### 1.4 — `src/skills/SkillSystem.ts` (GUNCELLE)

**Degisiklikler:**
- Edge-detect `keyDown` → `startCharge()` cagir
- Edge-detect `keyUp` → `release()` ile cast et
- Cast sirasinda charge level'a gore farkli parametre kullan
- `castLockTimer` ekle: cast animasyonu sirasinda baska skill kullanilmaz
- `iframeTimer` ekle: hasar yenmez suresi

**Yeni akis:**
```
keyDown → chargeSystem.startCharge(skillKey, config)
  her frame: chargeSystem.update(dt) → ChargeState donuyor
keyUp → chargeSystem.release() → { level, time }
  → damage/range/mp level'a gore sec
  → onceki gibi onCast callback cagir, ama level bilgisini de gonder
```

**SkillCastResult guncelleme:**
```typescript
interface SkillCastResult {
  skill: SkillDef
  damage: number
  chargeLevel: ChargeLevel    // YENi
  chargeTime: number          // YENi
  range: number               // YENi (charge'a gore degisen)
}
```

### 1.5 — `src/player/PlayerController.ts` (GUNCELLE)

**Degisiklikler:**
- `setMoveSpeedMultiplier(mult: number)` metodu ekle
- Charge sirasinda hiz azaltma icin ChargeSystem tarafindan cagirilir
- `setCastLock(duration: number)` → hareket kilitlenir

---

## SPRINT 2: Hedefleme Sistemi

### Amac
AoE yeteneklerde zemin gostergesi, dash'lerde yon oku.

### 2.1 — `src/skills/TargetingSystem.ts` (YENi)

**Sorumluluk:** Charge sirasinda zemin/yon gostergesi olusturma ve guncelleme

```
TargetingMode = 'aoe_circle' | 'direction_arrow' | 'none'

TargetingConfig {
  mode: TargetingMode
  minRadius: number       // Tap radius
  maxRadius: number       // MAX charge radius
  maxRange: number        // Fare menzil siniri
  color: Color3
}

Metotlar:
  activate(config: TargetingConfig): void
  update(dt: number, mouseWorldPos: Vector3, chargeLevel: ChargeLevel): void
  getTargetPosition(): Vector3
  getDirection(): Vector3
  deactivate(): void
```

**AoE Daire Gorseli:**
- ShaderMaterial disk (yarı-saydam, pulse kenarlar)
- Daire fareyi takip eder (maks menzil sinirli)
- Charge arttikca daire buyur
- Renk degisimi: Normal → Lv1 (sari kenar) → MAX (kirmizi kenar, pulse)
- Daire icindeki dusmanlar kirmizi highlight

**Yon Gostergesi:**
- Oyuncudan fareye dogru ok mesh
- Mesafe: Dash menzili kadar
- Charge arttikca ok uzar + kalinlasir

### 2.2 — `src/ui/TargetingUI.ts` (YENi)

**Sorumluluk:** Charge bar gorseli + hedefleme bilgi UI

```
Icerik:
  - Charge progress bar (ekranin altinda, skill bar ustunde)
  - 3 seviye isaretcisi (Tap | Lv1 | MAX)
  - Menzil disindaysa "Menzil Disi" uyarisi
  - Charge MAX'ta "HAZIR!" yazisi (pulse efekt)
```

### 2.3 — `src/scenes/TestScene.ts` (GUNCELLE)

**handleSkillCast degisiklikleri:**
- chargeLevel parametresi eklenir
- Her skill icin level bazli farkli davranis:
  - Q tap: 6 birim dash, Q max: 16 birim dash + shockwave
  - R tap: self-centered patlama, R charge: hedef noktada patlama
  - E tap: 3sn kalkan, E max: 8sn + patlayan kalkan
  - F: her zaman sinematik (tap = kucuk, max = dev)

---

## SPRINT 3: Combo Zincir Sistemi

### Amac
Skill-to-skill combo'lar (Q→R, E→F vb.) + bonus hasar.

### 3.1 — `src/skills/ComboChainSystem.ts` (YENi)

**Sorumluluk:** Combo penceresi yonetimi + bonus hesaplama

```
ComboLink {
  from: string          // 'shadowBlade'
  to: string            // 'shadowBurst'
  name: string          // 'Golge Kesisimi'
  bonusType: 'damage' | 'range' | 'cooldown' | 'free' | 'instant'
  bonusValue: number    // 0.3 = +%30
}

ComboChainSystem {
  private comboWindow: number = 1.5  // saniye
  private windowTimer: number = 0
  private lastSkillId: string | null
  private comboStreak: number = 0
  private comboLinks: ComboLink[]
  
  onSkillHit(skillId: string): void    // Combo penceresi ac
  checkCombo(nextSkillId: string): ComboBonus | null
  update(dt: number): void
  getActiveWindow(): { remaining: number, possibleCombos: ComboLink[] }
}
```

**Combo Tanimlari (dokumandan):**
```
Q → R  = "Golge Kesisimi"      → R hasari +%30
Q → Normal = "Momentum"        → Ilk vurus otomatik kritik
E → F  = "Korumali Hukum"      → F cast suresi %50 azalir
R → Q  = "Patlama Kacisi"      → Q mesafesi 2x, MP 0
F → R  = "Hukumdar Gazabi"     → R AoE alani 2x
Finisher → Q = "Finisher Dash" → Q hasari +%50

Boss Drop Combo'lari:
Alev → Yildirim = "Firtina Atesi"     → Yildirim yanik dusmanlara +%50
Buz → R = "Buzul Kirilmasi"           → Donmus dusmanlara 3x hasar
Kan Ofkesi aktif → herhangi = combo bonuslari 2x
Golge Alani → Bosluk Darbesi = "Boyut Yikimi" → Bosluk AoE olur
```

### 3.2 — `src/ui/ComboUI.ts` (YENi)

**Sorumluluk:** Combo bilgi gorselleri

```
Icerik:
  - Combo timer bar (ekranin ortasinda, kucuk, 1.5sn geri sayim)
  - Combo tetiklenince: "GOLGE KESISIMi!" yazisi (sag taraf, 0.8sn fade)
  - Combo streak sayaci: x2, x3, x4...
  - Skill bar'da uygun yetenekler parlak kenar alir
```

### 3.3 — `src/skills/SkillSystem.ts` (GUNCELLE)

**Degisiklikler:**
- Her cast sonrasi `comboChain.onSkillHit(skillId)` cagir
- Cast oncesi `comboChain.checkCombo(skillId)` kontrol et
- Combo bonus varsa: damage/range/cooldown modifiye et
- ComboUI'a bilgi gonder

### 3.4 — `src/combat/ComboSystem.ts` (GUNCELLE)

**Degisiklikler:**
- 4. vurus eklenir (bonus hit, 0.3sn pencere)
- Vurus 4: 2.2x STR, 360 derece, 0.5sn duration
- Vurus 3 recovery'si Q veya Void Strike ile iptal edilebilir (animation cancel)

---

## SPRINT 4: Zaman & Kamera Efektleri

### Amac
Slow-motion + sinematik kamera anları.

### 4.1 — `src/vfx/effects/SlowMotion.ts` (YENi)

**Sorumluluk:** Engine time scale kontrolu

```
SlowMotion {
  private engine: Engine
  private targetScale: number = 1.0
  private currentScale: number = 1.0
  private duration: number = 0
  
  trigger(timeScale: number, duration: number): void
  update(dt: number): void   // realDt kullan, game dt degil
  getRealDt(gameDt: number): number
}
```

**Kullanim yerleri:**
- Perfect Parry: 0.15sn, scale 0.3
- Q Charge MAX varisinda: 0.1sn, scale 0.3
- F Aura sinematik: 0.2sn, scale 0.2
- Kombo 4. vurus: 0.05sn, scale 0.3
- Shadow Domain: 0.3sn, scale 0.2

### 4.2 — `src/vfx/effects/CinematicCamera.ts` (YENi)

**Sorumluluk:** Gecici kamera animasyonlari

```
CameraSequence {
  steps: CameraStep[]
}

CameraStep {
  type: 'zoom' | 'pan' | 'orbit' | 'fov' | 'lookAt'
  target: Vector3 | number     // position veya fov degeri
  duration: number
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

CinematicCamera {
  private camera: ArcRotateCamera
  private originalState: { alpha, beta, radius, target, fov }
  
  play(sequence: CameraSequence): Promise<void>
  restore(duration: number): void    // Orijinal konuma don
  cancel(): void
}
```

**On tanimli sekanslar:**
```
PARRY_ZOOM:     FOV -5, 0.1sn → restore 0.1sn
Q_MAX_ARRIVAL:  zoom-in 0.15sn → zoom-out 0.15sn
F_CINEMATIC:    pull-out 0.3sn → bird's eye 0.3sn → slow-mo → snap back 0.5sn
DOMAIN_EXPAND:  yukari cekil 0.3sn → close-up 0.3sn → wide 0.4sn → normal 0.5sn
```

### 4.3 — `src/vfx/SkillVFXManager.ts` (GUNCELLE)

**Eklenecekler:**
- `slowMotion: SlowMotion` alt-sistem
- `cinematicCamera: CinematicCamera` alt-sistem
- `update()` icinde her ikisini de guncelle
- SlowMotion aktifken realDt/gameDt ayrimini yonet

---

## SPRINT 5: Perfect Parry Sistemi

### Amac
E kalkaninin ilk X saniyesinde vuruş alma → parry tetiklenir.

### 5.1 — `src/skills/ParrySystem.ts` (YENi)

**Sorumluluk:** Parry penceresi takibi + tetikleme

```
ParrySystem {
  private parryWindowTimer: number = 0
  private parryActive: boolean = false
  private parryConfig: { window: number, stunDuration: number, reflectPercent: number }
  
  activateParry(config): void
  update(dt: number): void
  isParryActive(): boolean
  
  // Hasar alindiginda cagrilir
  checkParry(incomingDamage: number, attacker: Enemy): ParryResult | null
}

ParryResult {
  reflectedDamage: number
  stunDuration: number
  openComboWindow: boolean
}
```

### 5.2 — `src/scenes/TestScene.ts` (GUNCELLE)

**handleEnemyAttack degisiklikleri:**
- Hasar uygulamadan once `parrySystem.checkParry()` kontrol et
- Parry basarili ise:
  - Hasar sifirlanir
  - Saldiran stun olur
  - Hasar yansitilir
  - Combo penceresi acilir
  - Parry VFX tetiklenir

### 5.3 — `src/vfx/skills/ParryVFX.ts` (YENi)

**Icerik:**
- Ekran beyaz flash (0.05sn)
- Shockwave (radius 3)
- 200 beyaz-altin kivilcim burst
- ScreenShake (0.12, 0.15sn)
- SlowMotion (0.15sn, scale 0.3)
- "PARRY!" yazisi

---

## SPRINT 6: Gelismis VFX Efektleri

### Amac
Eksik VFX alt-sistemlerini ekle.

### 6.1 — `src/vfx/effects/AfterimageEffect.ts` (YENi)

**Sorumluluk:** Dash sirasinda golge siluetleri

```
AfterimageEffect {
  spawn(position: Vector3, rotation: Vector3, count: number, interval: number): void
  // Her afterimage: yari-saydam oyuncu silueti (siyah-mor)
  // 0.3sn fade-out
  // Stagger: count adet, interval arayla
}
```

**Uygulama:** Oyuncu mesh'ini klonla → siyah-mor StandardMaterial → alpha fade → dispose

### 6.2 — `src/vfx/effects/DissolveEffect.ts` (YENi)

**Sorumluluk:** Mesh kaybolma/belirme efekti (Void Strike)

```
DissolveEffect {
  dissolve(mesh: Mesh, duration: number, color: Color3): Promise<void>
  reassemble(mesh: Mesh, duration: number, color: Color3): Promise<void>
}
```

**Uygulama:** ShaderMaterial ile Perlin noise threshold animasyonu. Threshold 0→1 gittikce mesh pixel pixel kaybolur.

### 6.3 — `src/vfx/effects/ProjectileEffect.ts` (YENi)

**Sorumluluk:** Uzayan mermi efekti (Alev Patlamasi ates topu)

```
ProjectileEffect {
  launch(params: {
    start: Vector3
    direction: Vector3
    speed: number
    maxRange: number
    radius: number         // gorsel boyut
    particleConfig: string // 'fire' | 'ice' | 'shadow'
    onHit: (pos: Vector3) => void
    onMaxRange: (pos: Vector3) => void
  }): void
  
  update(dt: number): void
}
```

**Icerik:** Core kure mesh + trailing particles + PointLight + kuyruk trail

### 6.4 — `src/vfx/effects/ShieldSphereEffect.ts` (YENi)

**Sorumluluk:** Fresnel shader kalkan kuresi (E yetenegi icin)

```
ShieldSphereEffect {
  create(center: Vector3, radius: number, color: Color3): ShieldSphere
  // Fresnel shader: ic seffaf, kenar glow
  // Hex pattern: altigen grid UV animasyonu
  // Ambient particles: yuzeyinde yavas donen 80 partikul
}
```

### 6.5 — `src/vfx/effects/DomainEffect.ts` (YENi)

**Sorumluluk:** Golge Alani kubbe + zemin donusumu

```
DomainEffect {
  expand(center: Vector3, radius: number, duration: number): void
  sustain(duration: number): void   // 10sn aktif alan
  collapse(duration: number): void  // 3sn dissolve
}
```

**Icerik:** Buyuk yari-kure mesh + siyah reflektif zemin shader + volumetric light + ambient darken

---

## SPRINT 7: Charge VFX Varyasyonlari

### Amac
Her yetenek icin Tap/Lv1/MAX farkli VFX setleri.

### 7.1 — `src/vfx/skills/DashTrailVFX.ts` (GUNCELLE)

**Degisiklikler:**
- `playDashTrailVFX` → `chargeLevel` parametresi ekle
- Tap: Mevcut efekt (trail + sparks + slash)
- Lv1: + gecis hasari slash'leri + daha genis trail
- MAX: + 3 afterimage + kalin golge izi + varis shockwave + GPU particles + shake + slow-mo

### 7.2 — `src/vfx/skills/ShieldVFX.ts` (GUNCELLE)

**Degisiklikler:**
- Tap: Mevcut halkalar → Fresnel sphere + hex pattern
- MAX: + kalkan kirilinca patlama VFX (kure genisleme + hex parcalanma + 1500 partikul)
- Perfect Parry VFX entegrasyonu

### 7.3 — `src/vfx/skills/BurstVFX.ts` (GUNCELLE)

**Degisiklikler:**
- Tap: Self-centered tek patlama (mevcut)
- Charge: Hedef noktada patlama (TargetingSystem pozisyonu)
- MAX: 3x ardisik patlama (0.3sn arayla, azalan boyut) + havaya firlatma + slow-mo

### 7.4 — `src/vfx/skills/AuraVFX.ts` (GUNCELLE)

**Degisiklikler:**
- Tap: Mevcut efekt
- MAX Sinematik: Levitation + golge firtinasi + 3 katman rune + golge elleri + ambient darken + sinematik kamera

### 7.5 — Diger 6 boss skill VFX dosyasi (GUNCELLE)

Her birine chargeLevel destegi eklenir.

---

## SPRINT 8: Normal Saldiri Zinciri Yeniden Tasarimi

### Amac
4 vuruslu combo + VFX progresyonu.

### 8.1 — `src/combat/ComboSystem.ts` (GUNCELLE)

**Degisiklikler:**
- 4. vurus eklenir: 2.2x STR, 360 derece, 0.5sn
- Vurus 4 sadece vurus 3'ten sonra 0.3sn icinde tiklanirsa
- Her vurusin VFX progresyonu bilgisi eklenir
- Animation cancel destegi: vurus 3 recovery → Q/VoidStrike ile iptal

### 8.2 — `src/vfx/skills/ComboVFX.ts` (GUNCELLE)

**Degisiklikler:**
- Vurus 1: ince beyaz ark, 15 kivilcim
- Vurus 2: orta beyaz-mor ark, 25 kivilcim + mini trail
- Vurus 3: kalin mor ark + zemin ripple, 50 kivilcim + shockwave + mini shake
- Vurus 4: cift altin-mor ark (360), 100 kivilcim + halka + shake + 0.05sn slow-mo

---

## SPRINT 9: Arise Yeniden Tasarimi

### Amac
Otomatik arise → manuel arise (E tusu + sekans).

### 9.1 — `src/shadows/AriseSystem.ts` (YENi)

**Sorumluluk:** Arise mekanigi yonetimi

```
AriseSystem {
  private ariseCandidates: Map<string, { position: Vector3, expireTime: number }>
  
  onEnemyDeath(enemy: Enemy): void   // Aday olarak kaydet
  tryArise(position: Vector3): AriseResult
  update(dt: number): void            // Suresi dolanlari kaldir
}

AriseResult {
  success: boolean
  shadowType: string
  message: string
}
```

**Mekanik:**
- Dusman oldugunde: %60 baz sans (+ INT*%0.5)
- Oyuncu cesede yaklasip E'ye 1sn basili tutarsa arise dener
- Basarisiz: "Ruh direniyor" mesaji, 5sn ekstra sure
- Boss: 2sn basili tut, %40 baz sans, 1 ekstra hak

### 9.2 — `src/ui/AriseUI.ts` (YENi)

**Icerik:**
- Ceset yakininda "E — Arise" prompt gorseli
- Basili tutma progress bar
- "ARISE" buyuk yazi (0.3sn'de, mor, glow, fade-out)
- Basari/basarisizlik mesaji

### 9.3 — `src/vfx/skills/AriseVFX.ts` (GUNCELLE)

**Degisiklikler:**
- Mevcut portal + flash efektine ek:
- Boss arise: 3x boyut portal + golge sutunlari + sinematik kamera + slow-mo
- "ARISE" yazisi efekti (billboard text mesh veya DOM overlay)

---

## SPRINT 10: Golge Ordusu Savas VFX

### Amac
Golge askerleri saldiri efekti + mod degisim aurasi.

### 10.1 — `src/vfx/skills/ShadowArmyVFX.ts` (YENi)

**Icerik:**
- Golge saldiri slash efekti (kucuk mor ark)
- Kritik vuruş: mor flash + ekstra kivilcim
- Mod degisimi (G tusu):
  - Saldiri modu: kirmizi goz pariltisi + agresif kirmizi partikuller + kirmizi pulse dalga
  - Savunma modu: mavi goz pariltisi + kalkan mavi partikuller + mavi pulse dalga

### 10.2 — `src/shadows/ShadowSoldier.ts` (GUNCELLE)

**Degisiklikler:**
- Saldiri aninda VFX tetikleme callback'i
- Mod degisimi aninda aura degistirme

---

## SPRINT 11: UI Guncellemeleri

### 11.1 — `src/ui/ComboUI.ts` (YENi — Sprint 3'te tanimli)
### 11.2 — `src/ui/TargetingUI.ts` (YENi — Sprint 2'de tanimli)
### 11.3 — `src/ui/AriseUI.ts` (YENi — Sprint 9'da tanimli)

### 11.4 — `src/ui/SkillBar.ts` (GUNCELLE)

**Degisiklikler:**
- Charge sirasinda slot gorseli: progress overlay + kenar renk degisimi
- Combo penceresi aktifken: uygun slotlarda parlak kenar
- Parry basariliyken: E slotunda altin flash

---

## SPRINT 12: Entegrasyon & Denge

### 12.1 — `src/scenes/TestScene.ts` (BUYUK GUNCELLEME)

**Degisiklikler:**
- ChargeSystem olusturma + SkillSystem'a baglama
- TargetingSystem olusturma + render loop'a ekleme
- ComboChainSystem olusturma + skill cast callback'e ekleme
- ParrySystem olusturma + handleEnemyAttack'e ekleme
- AriseSystem olusturma + enemy death callback'e ekleme
- SlowMotion + CinematicCamera VFX manager'a baglama
- handleSkillCast'te chargeLevel bazli dallanma

### 12.2 — `src/scenes/DungeonScene.ts` (AYNI GUNCELLEMELER)

### 12.3 — `src/config/GameConfig.ts` (BUYUK GUNCELLEME)

**Eklenecek konfigurasyonlar:**
```typescript
CHARGE: {
  defaultLv1Threshold: 0.3,
  defaultMaxThreshold: 2.0,
},
COMBO_CHAIN: {
  windowDuration: 1.5,
  streakDecay: 3.0,    // Combo streak azalma suresi
},
PARRY: {
  defaultWindow: 0.4,
  defaultStun: 0.5,
  defaultReflect: 0.3,
},
ARISE: {
  baseChance: 0.6,
  intBonusPerPoint: 0.005,
  holdDuration: 1.0,
  bossHoldDuration: 2.0,
  bossBaseChance: 0.4,
  corpseExpireTime: 15,
},
SLOW_MOTION: {
  parryScale: 0.3,
  parryDuration: 0.15,
  ultimateScale: 0.2,
  ultimateDuration: 0.2,
},
```

### 12.4 — `src/vfx/SkillVFXManager.ts` (GUNCELLE)

**Degisiklikler:**
- ULTRA kalite seviyesi eklenir
- TrailPool, DecalPool, LightPool (mevcut sistemlerin uzerine optional)
- Max 3 eszamanli skill VFX siniri
- `forceFinish()` ile eski efekti erken bitir

### 12.5 — `src/core/EventBus.ts` (GUNCELLE)

**Yeni eventler:**
```typescript
'charge:start':    { skillId: string }
'charge:level':    { skillId: string, level: ChargeLevel }
'charge:release':  { skillId: string, level: ChargeLevel }
'charge:cancel':   { skillId: string }
'combo:chain':     { name: string, from: string, to: string, bonus: number }
'combo:streak':    { count: number }
'parry:success':   { reflectedDamage: number, stunDuration: number }
'arise:attempt':   { position: Vector3 }
'arise:success':   { shadowType: string }
'arise:fail':      { reason: string }
'slowmo:start':    { scale: number, duration: number }
'slowmo:end':      {}
```

---

## DOSYA OLUSTURMA / GUNCELLEME OZETI

### Yeni Dosyalar (17 adet)
| # | Dosya | Sprint | Satirlar (tahmini) |
|---|-------|--------|-------------------|
| 1 | src/skills/ChargeSystem.ts | 1 | ~180 |
| 2 | src/skills/TargetingSystem.ts | 2 | ~250 |
| 3 | src/skills/ComboChainSystem.ts | 3 | ~200 |
| 4 | src/skills/ParrySystem.ts | 5 | ~120 |
| 5 | src/shadows/AriseSystem.ts | 9 | ~180 |
| 6 | src/vfx/effects/SlowMotion.ts | 4 | ~80 |
| 7 | src/vfx/effects/CinematicCamera.ts | 4 | ~200 |
| 8 | src/vfx/effects/AfterimageEffect.ts | 6 | ~120 |
| 9 | src/vfx/effects/DissolveEffect.ts | 6 | ~150 |
| 10 | src/vfx/effects/ProjectileEffect.ts | 6 | ~180 |
| 11 | src/vfx/effects/ShieldSphereEffect.ts | 6 | ~150 |
| 12 | src/vfx/effects/DomainEffect.ts | 6 | ~200 |
| 13 | src/vfx/skills/ParryVFX.ts | 5 | ~100 |
| 14 | src/vfx/skills/ShadowArmyVFX.ts | 10 | ~150 |
| 15 | src/ui/ComboUI.ts | 3 | ~150 |
| 16 | src/ui/TargetingUI.ts | 2 | ~130 |
| 17 | src/ui/AriseUI.ts | 9 | ~120 |
| | **TOPLAM** | | **~2560** |

### Guncellenecek Dosyalar (18 adet)
| # | Dosya | Sprint | Degisiklik Boyutu |
|---|-------|--------|-------------------|
| 1 | src/skills/SkillDef.ts | 1 | Kucuk (charge interface) |
| 2 | src/skills/SkillSystem.ts | 1,3,12 | BUYUK (charge + combo + parry entegrasyon) |
| 3 | src/config/GameConfig.ts | 1,12 | BUYUK (tum charge/combo/parry/arise config) |
| 4 | src/player/PlayerController.ts | 1 | Orta (speed mult + cast lock) |
| 5 | src/combat/ComboSystem.ts | 8 | Orta (4. vurus + cancel) |
| 6 | src/core/EventBus.ts | 12 | Kucuk (yeni event tipleri) |
| 7 | src/ui/SkillBar.ts | 11 | Orta (charge/combo gorselleri) |
| 8 | src/vfx/SkillVFXManager.ts | 4,12 | Orta (slowmo + cinematic + ULTRA) |
| 9 | src/vfx/skills/DashTrailVFX.ts | 7 | BUYUK (3 seviye VFX) |
| 10 | src/vfx/skills/ShieldVFX.ts | 7 | BUYUK (Fresnel + parry + patlama) |
| 11 | src/vfx/skills/BurstVFX.ts | 7 | BUYUK (3x patlama + hedefleme) |
| 12 | src/vfx/skills/AuraVFX.ts | 7 | BUYUK (sinematik + levitation) |
| 13 | src/vfx/skills/FlameburstVFX.ts | 7 | Orta (projectile entegrasyon) |
| 14 | src/vfx/skills/LightningVFX.ts | 7 | Orta (chain VFX) |
| 15 | src/vfx/skills/ComboVFX.ts | 8 | Orta (4 vurus + progresyon) |
| 16 | src/vfx/skills/AriseVFX.ts | 9 | Orta (boss arise + sinematik) |
| 17 | src/scenes/TestScene.ts | 2,5,9,12 | BUYUK (tum sistem entegrasyonu) |
| 18 | src/scenes/DungeonScene.ts | 12 | BUYUK (ayni entegrasyon) |

---

## PERFORMANS BUTCESI (Guncellenmis)

| Kategori | Mevcut | Hedef |
|----------|--------|-------|
| Aktif ParticleSystem | 8 | 10 |
| Toplam partikul | 15.000 | 20.000 |
| GlowLayer | 512px | 512px (ULTRA: 1024px) |
| PointLight | 6 | 8 |
| ShaderMaterial pass | - | 5 |
| TrailMesh | - | 4 |
| GroundDecal | - | 5 |
| Eszamanli skill VFX | - | 3 (fazlasi erken bitirilir) |

---

## UYGULAMA SIRASI VE BAGIMLILIKLARI

```
Sprint 1 (ChargeSystem)
  ↓
Sprint 2 (TargetingSystem)  ←── Sprint 1'e bagimli (charge level bilir)
  ↓
Sprint 3 (ComboChainSystem) ←── Sprint 1'e bagimli (cast callback)
  ↓
Sprint 4 (SlowMotion + Cinematic) ←── Bagimsiz, ama Sprint 1 sonrasi mantikli
  ↓
Sprint 5 (Perfect Parry)    ←── Sprint 1 + 4'e bagimli
  ↓
Sprint 6 (Gelismis VFX)     ←── Sprint 4'e bagimli (slowmo, cinematic)
  ↓
Sprint 7 (Charge VFX)       ←── Sprint 1 + 6'ya bagimli
  ↓
Sprint 8 (Combo Vuruslari)  ←── Sprint 3 + 6'ya bagimli
  ↓
Sprint 9 (Arise)            ←── Sprint 4 + 6'ya bagimli
  ↓
Sprint 10 (Golge Ordusu VFX) ←── Sprint 6'ya bagimli
  ↓
Sprint 11 (UI)              ←── Sprint 1-3'e bagimli
  ↓
Sprint 12 (Entegrasyon)     ←── HEPSINE bagimli — son sprint
```

---

## DOGRULAMA KONTROL LISTESI

Her sprint sonunda:
- [ ] `npx tsc --noEmit` → 0 hata
- [ ] Vite dev server calisiyor
- [ ] Mevcut 4 yetenek (Q/E/R/F) hala calisiyor (regresyon yok)
- [ ] Boss skill'ler hala calisiyor
- [ ] 60 FPS korunuyor (performans butcesi asilmiyor)
- [ ] Yeni sistem EventBus uzerinden duzgun iletisim kuruyor

Tam entegrasyon sonunda:
- [ ] Q charge: Tap → kisa dash, MAX → uzun dash + shockwave + slow-mo
- [ ] E parry: Ilk 0.4sn'de vuruş → parry tetikleniyor
- [ ] R hedefleme: Basili tut → zemin dairesi, birak → patlama
- [ ] F sinematik: MAX charge → kamera sekans + slow-mo + dev patlama
- [ ] Combo zinciri: Q→R → "Golge Kesisimi" +%30 hasar
- [ ] Arise: Ceset yaninda E basili tut → arise sekans
- [ ] Golge ordusu: Saldiri/savunma mod degisiminde VFX
- [ ] Tum boss skill'ler charge destegi
- [ ] 4. normal saldiri vurusu calisıyor
