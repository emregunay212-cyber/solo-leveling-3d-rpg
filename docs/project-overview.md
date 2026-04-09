# Solo Leveling 3D RPG — Proje Dokumantasyonu

## Genel Bakis

Solo Leveling anime/manhwa'sindan ilham alan, tarayici tabanli 3D Hack & Slash RPG.
Metin2 tarzi grind, golge ordusu yonetimi, zindan raid sistemi ve derin karakter gelisimi iceren tam kapsamli bir oyun.

**Teknoloji:**
- Motor: Babylon.js v9 (WebGL2)
- Fizik: Havok Physics v1.3
- Build: Vite v8 + TypeScript (strict mode)
- Test: Vitest

**Toplam:** ~57 kaynak dosya, ~14.000+ satir TypeScript

---

## Dizin Yapisi

```
src/
  core/        (7)   Motor, girdi, sahne yonetimi, event bus
  player/      (3)   Oyuncu kontrolcu, kamera, dovus
  combat/      (7)   Dovus sistemi, kombo, hasar hesaplama
  enemies/     (3)   Dusman entity, AI, test dummy
  progression/ (3)   Level sistemi, oyuncu rank
  skills/      (5)   Yetenek sistemi, efektler, tanimlar
  shadows/     (7)   Golge askerleri, ordu, profil, stat hesaplama
  dungeon/     (4)   Zindan yonetici, tanimlar, cooldown
  systems/     (6)   SafeZone, drop, respawn, envanter, dev konsol
  ui/          (10)  HUD, skill bar, stat panel, golge UI, zindan UI
  scenes/      (2)   TestScene (acik dunya), DungeonScene (zindan)
  config/      (2)   GameConfig (tum denge parametreleri)
  data/        (4)   Dusman, boss, yetenek kitabi, drop tablolari
```

---

## Cekirdek Sistemler

### 1. Motor ve Sahne Yonetimi

**`core/Engine.ts`** — Babylon.js + Havok baslangici, render dongusu
**`core/SceneManager.ts`** — Sahne kayit/gecis (TestScene <-> DungeonScene)
**`core/EventBus.ts`** — Tipli pub/sub olay sistemi (20+ olay tipi)
**`core/InputManager.ts`** — Klavye/fare girdi takibi
**`Game.ts`** — Merkezi oyun sinifi, sahneler arasi paylasilan state tutar

Paylasilan state pattern'i:
```
this.game.levelSystem     — Level/XP/stat verileri
this.game.skillSystem     — Yetenek upgrade/cooldown
this.game.shadowProfileManager — Golge profilleri
this.game.shadowInventory — Envanter (kitaplar, altin)
this.game.playerRankSystem — Oyuncu ranki
this.game.savedSoulSlots  — Golge slot verileri
this.game.savedActiveShadows — Aktif golge snapshot
```

### 2. Oyuncu Sistemi

**`player/PlayerController.ts`** — Havok CharacterController ile hareket
- WASD yurume (5 birim/sn), Shift kosma (9 birim/sn), C blok
- Lerp ile yumusak donus, raycast ile zemin takibi

**`player/PlayerCamera.ts`** — 3. sahis arc rotate kamera
- Sag tik surukle ile donus, tekerlek ile zoom (3-15)

**`player/PlayerCombat.ts`** — Dovus durum makinesi
- Oto-saldiri, 3'lu kombo, cift tiklama algilama, parry/blok

### 3. Dovus Sistemi

**`combat/CombatSystem.ts`** — Mesafe + aci kontrolleri
- Saldiri menzili: 4 birim, saldiri konisi: 90 derece
- Arkadan vurus (backstab): 1.5x carpan
- Kritik sans: %15 -> 2x hasar

**`combat/ComboSystem.ts`** — 3 vurus zincirleme
```
Vurus 1: 1.0x hasar, 0.35sn
Vurus 2: 1.2x hasar, 0.35sn
Vurus 3: 1.8x hasar, 0.5sn (finisher)
```

**`combat/DamageCalculator.ts`** — Hasar formulu
- Temel hasar + stat olcekleme + savunma azaltma
- Hasar varyansi: %85-%115

**`combat/DamageNumbers.ts`** — Havada suzulen hasar rakamlari
- 30'lu nesne havuzu, 8 renk kodu (normal/kritik/skill/arise vb.)

### 4. Dusman Sistemi

**`enemies/Enemy.ts`** — Dusman entity
- EnemyDef: hp, damage, defense, level, color, scale, shadowSkillIds
- Davranissal parametreler: attackSpeed, moveSpeed, attackRange, detectionRange vb.
- Tehdit sistemi: golge saldirilari threat olusturur

**`enemies/EnemyAI.ts`** — Sonlu durum makinesi
```
IDLE -> PATROL -> CHASE -> ATTACK -> RETURN -> IDLE (veya DEAD)
```
- Leash: spawn'dan 20 birim uzaklasirsa geri doner
- Safe Zone: oyuncu guvenli bolgede ise takip/saldiri durur
- Her dusman kendi hiz/menzil/cooldown parametreleri ile farkli davranir

**30 Dusman Cesidi (data/enemies.ts):**
| Rank | Dusmanlar |
|------|-----------|
| E | Goblin, Kurt, Dev Sican, Yarasa, Yilan |
| D | Iskelet, Ork, Dev Orumcek, Tas Golem, Zombi |
| C | Kara Sovalye, Naga, Buz Ayisi, Kurt Adam, Karanlik Elf |
| B | Seytan, Olum Sovalyesi, Dev Kirkayak, Ates Imp, Yuksek Ork |
| A | Buz Elf Sovalyesi, Cerberus, Lich, Drake Savascisi |
| S | Karinca Krali, Ejderha, Bas Seytan, Golge Sovalyesi |

**12 Boss (data/dungeonBosses.ts):**
Goblin Kral, Iskelet Lord, Ork Savaskani, Karanlik Buyucu, Seytan Lord, Golge Hukumdari
+ Dev Sican Kralicesi, Orumcek Kralicesi, Kurt Adam Alfa, Olum Sovalye Lordu, Baruka, Kamish

### 5. Level ve Ilerleme Sistemi

**`progression/LevelSystem.ts`** — Metin2 zorlugunda XP egrisi
```
XP gereksinimi = 80 * level * 25 * (2.5)^(level-1)
```
- Maks seviye: 100
- Seviye basina: 5 stat puani + otomatik +1 tum statlara
- Olum cezasi: %5 XP kaybi

**Temel Statlar:** STR, VIT, AGI, INT (baslangic: 5, cap: 90)

**Turetilmis Statlar:**
| Stat | Baz | Carpan | Maks |
|------|-----|--------|------|
| Max HP | 80 | STR*8 | 800 |
| Max MP | 30 | INT*5 | 480 |
| Saldiri | 10 | STR*2 | 190 |
| Kritik | %5 | AGI*%0.5 | %40 |
| Saldiri Hizi | 1.0 | AGI*0.02 | 2.0x |
| Hareket Hizi | 5 | AGI*0.05 | 8.0 |
| Savunma | 2 | VIT*1.5 | 150 |

### 6. Yetenek Sistemi

**`skills/SkillSystem.ts`** — Q/E/R/F slot yonetimi

**Baslangic Yetenekleri:**
| Tus | Yetenek | Tip | MP | Cooldown | Hasar |
|-----|---------|-----|----|---------:|------:|
| Q | Golge Bicagi | Dash | 15 | 3sn | 1.5x STR |
| E | Golge Kalkani | Buff | 25 | 10sn | %60 hasar azaltma |
| R | Golge Patlama | AoE | 40 | 8sn | 3.0x INT |
| F | Hukumdar Aurasi | Ultimate | 80 | 30sn | 5.0x INT + yavaslama |

**Yetenek Kitabi Upgrade:** Her kitap +%15 hasar, -%5 cooldown (maks 5 seviye)

**Boss Drop Yetenekleri (6 adet):**
- Alev Patlamasi (B-rank AoE), Yildirim Zinciri (B-rank AoE)
- Buz Hapishanesi (A-rank Buff), Kan Ofkesi (A-rank Buff)
- Golge Alani (S-rank Ultimate), Bosluk Darbesi (S-rank Dash)

Boss yetenekleri ogrenildikten sonra YETENEKLER sekmesinden Q/E/R/F'e atanabilir.

**`progression/PlayerRankSystem.ts`** — Yetenek gucune gore rank
| Rank | Gerekli Guc |
|------|-------------|
| E | 10 |
| D | 30 |
| C | 60 |
| B | 100 |
| A | 150 |
| S | 250 |

### 7. Golge Ordusu Sistemi

**`shadows/ShadowSoldier.ts`** — Bireysel golge askeri
- Dusman olduruldugunde %60 sans ile cikarim (INT ile artar)
- Mor renkli, kucultulmus dusman mesh'i
- Isim etiketi (DynamicTexture)
- Dusmana ozgu yetenekler (enemy-intrinsic skills)

**`shadows/ShadowArmy.ts`** — Ordu yonetimi
- 4 soul slot (stok), aktif golge cagirma
- Saldiri/Savunma modu (G tusu)
- MP drenaji: 1-3 MP/sn aktif golge basina
- MP biterse HP drenaji: 3 HP/sn

**`shadows/ShadowProfileManager.ts`** — Profil CRUD
- Rank sistemi (sadece boss golgeleri rank atlar):
```
Asker (0 kill) -> Sovalye (15) -> Elit (50) -> Komutan (150)
```

**`shadows/ShadowStatCalculator.ts`** — Stat kopyalama
- Normal golge: oyuncu turetilmis statlarin %15'i
- Boss golge: %25-40 (ranka gore)
- Stat breakdown: baz + oyuncu + rank + yetenek

**19 Dusman-Icerik Yetenek:**
Hizli Saldiri, Suru Gucu, Zehirli Darbe, Agir Darbe, Sert Deri,
Kalkan Blogu, Golge Bicak, Can Emme, Cehennem Atesi, Ag Yavaslatma,
Suru Saldirisi, Buz Isirigi, Cinnet, Karanlik Buyu, Ates Nefesi,
Usak Cagirma, Uclu Vurus, Golge Klonu, Hayat Emme

### 8. Zindan (Dungeon) Sistemi

**`dungeon/DungeonManager.ts`** — Zindan durumu, dusman/boss yonetimi

**6 Rank Zindani:**
| Rank | Arena | Dusman | Stat Carpan | Boss HP | Boss DMG | Cooldown |
|------|------:|-------:|------------:|--------:|---------:|---------:|
| E | 40 | 8 | 1x | 8x | 4x | 30dk |
| D | 45 | 10 | 1.5x | 8x | 4x | 45dk |
| C | 50 | 12 | 2.5x | 8x | 4x | 60dk |
| B | 55 | 14 | 4x | 8x | 4x | 90dk |
| A | 60 | 16 | 6x | 8x | 4x | 120dk |
| S | 70 | 20 | 10x | 8x | 4x | 180dk |

**Olum Cezasi (Zindan):**
- XP kaybi: %35
- Esya kaybi sansi: %30
- Seviye dusebilir: EVET
- Sehirde respawn: tum zindan odulleri silinir

**Odul Carpanlari:** XP: E(1x)->S(15x), Altin: E(1x)->S(20x)

**Giris Kisitlamasi:** Oyuncu rankindan en fazla 2 ust seviye zindana girebilir

### 9. Guvenli Bolge Sistemi

**`systems/SafeZone.ts`** — Spawn noktasinda korunakli alan

- TestScene: origin (0,0,0) merkezli, 8 birim yaricap, mor gorsel
- DungeonScene: spawn noktasi merkezli, 6 birim yaricap, mavi gorsel
- EnemyAI tum state'lerinde kontrol: oyuncu safe zone icindeyse saldirmaz

### 10. UI Panelleri

| Panel | Erisim | Islem |
|-------|--------|-------|
| HUD | Her zaman | HP/MP/XP/Level/Altin |
| Stat Panel (StatsUI) | P tusu | Stat dagilimi, turetilmis degerler |
| Skill Bar | Her zaman (alt orta) | Q/E/R/F cooldown, MP cost |
| Golge Yonetimi (ShadowManageUI) | Tab tusu | 4 sekme: Detay, Dukkan, Kitaplar, Yetenekler |
| Zindan Secimi (DungeonSelectUI) | Portal'a yaklas | Rank secimi, cooldown, oneri seviyesi |
| Zindan HUD (DungeonHUD) | Zindan icinde | Dusman sayisi, boss HP bari |
| Olum Ekrani (DeathScreen) | Olunce | Respawn secenekleri |
| Golge Stok Secici (ShadowStockPicker) | Golge cagirma | Slot secimi popup |
| Tiklama Gostergesi (ClickIndicator) | Sag tik | Mor genisleten daire |

### 11. Drop Sistemi

**`systems/DropSystem.ts`** + **`data/shadowDropTables.ts`**

- 30 normal dusman + 12 boss icin drop tablolari
- Boss drop oranlari: %15-40 yetenek kitabi
- Yuksek rank bosslar nadir yetenek dusurur

### 12. Dev Konsol

**`systems/DevConsole.ts`** — Tarayici konsolundan debug

| Komut | Aciklama |
|-------|----------|
| `setLevel(n)` | Seviye ayarla |
| `addXp(n)` | XP ekle |
| `heal()` | HP/MP doldur |
| `god()` | Olumsuzluk ac/kapa |
| `kill()` | Tum dusmanlari oldur |
| `stats()` | Mevcut istatistikler |
| `setStat('str', n)` | Stat ayarla + turetilmis statlari guncelle |
| `addStatPoints(n)` | Stat puani ekle |
| `setDamage(n)` | Gecici saldiri hasari |
| `tp(x, y, z)` | Teleport |
| `dungeon('E')` | Zindana gir |
| `learnAll()` | Tum boss yeteneklerini ogren + upgrade maks |
| `addBook('id', n)` | Envantere kitap ekle |

---

## Oyun Dongusu

```
Game.init()
  -> Engine (Babylon + Havok)
  -> SceneManager.switchTo('test')

TestScene.onLoad()
  -> initWorld()        — Zemin, grid, engeller, portal
  -> initCombat()       — CombatSystem, DamageCalculator
  -> initProgression()  — LevelSystem, PlayerRankSystem
  -> initUI()           — HUD, StatsUI, SkillBar, ShadowUI
  -> setupSafeZone()    — Guvenli bolge
  -> spawnEnemies()     — 6 tip, sabit konumlarda

Her Frame:
  -> InputManager.poll()
  -> PlayerController.update()  — Hareket
  -> PlayerCamera.update()      — Kamera takibi
  -> EnemyAI.update() (x30)     — Dusman AI
  -> ShadowArmy.update()        — Golge ordusu
  -> SkillSystem.update()       — Yetenek cooldown
  -> CombatSystem kontrol       — Vurus algilama
  -> HUD.update()               — UI guncelleme
  -> Engine.render()            — Sahne cizimi

Zindan Gecisi:
  TestScene.enterDungeon(rank)
    -> Tum state Game nesnesine kaydedilir
    -> SceneManager.switchTo('dungeon')
  DungeonScene.onLoad()
    -> Shared state geri yuklenir
    -> Arena + dusmanlar olusturulur
  DungeonScene exit
    -> SceneManager.switchTo('test')
    -> TestScene shared state'i geri alir
```

---

## Olay Sistemi (EventBus)

```
player:damage, player:death, player:respawn, player:levelUp, player:xpGain
combat:hit, combat:combo
skill:cast, skill:hit, skill:upgraded
enemy:death, enemy:spawn
shadow:extracted, shadow:defeated, shadow:failed, shadow:rankUp, shadow:modeChanged
stat:changed, player:rankChanged
loot:drop
dungeon:enter, dungeon:exit, dungeon:bossSpawn, dungeon:bossDeath, dungeon:waveCleared
```

---

## Immutable Data Pattern

Tum state guncellemeleri spread operator ile yeni nesne olusturur:
```typescript
this.slotAssignments = { ...this.slotAssignments, [slot]: skillId };
this.skillPool = [...this.skillPool, skill];
```
Mevcut nesneler ASLA mutate edilmez.

---

## Yol Haritasi

**Tamamlanan (Faz 1-5):**
- [x] Cekirdek motor + fizik
- [x] Dovus sistemi (kombo, kritik, backstab, parry, blok)
- [x] 30 dusman cesidi + 12 boss + esik AI
- [x] Yetenek sistemi (Q/E/R/F) + upgrade + boss yetenekleri
- [x] Golge ordusu (cikarim, rank, stat kopyalama, savas modlari)
- [x] Zindan sistemi (6 rank, boss, cooldown, olum cezasi)
- [x] Oyuncu rank sistemi
- [x] Guvenli bolge sistemi

**Planlanan (Faz 6+):**
- [ ] Sehir merkezi + NPC
- [ ] Gelismis dukkan sistemi
- [ ] Ekipman sistemi (silah, zirh, aksesuar)
- [ ] Gorev sistemi (gunluk/haftalik)
- [ ] Kayit/yukleme + yerellestime
- [ ] PvP arena / cok oyunculu
