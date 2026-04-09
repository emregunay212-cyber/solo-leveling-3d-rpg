# Guvenli Bolge (Safe Zone) Sistemi

## Genel Bakis

Oyuncunun dogma (spawn) noktasinda dusmanlarin giremeyecegi korunakli bir alan sistemi.
Hem ana dunya (TestScene) hem de zindan (DungeonScene) sahnelerinde aktif.

## Mimari

```
SafeZone (veri) ──> SafeZoneRegistry (global liste)
                            |
                    EnemyAI (kontrol)
                            |
                 Dusman safe zone icinde mi?
                    Evet → RETURN state
                    Hayir → Normal AI
```

## Dosyalar

| Dosya | Gorev |
|-------|-------|
| `src/systems/SafeZone.ts` | SafeZone sinifi, SafeZoneRegistry, gorsel olusturucu |
| `src/enemies/EnemyAI.ts` | AI state'lerinde safe zone kontrolu |
| `src/scenes/TestScene.ts` | Ana dunya safe zone olusturma |
| `src/scenes/DungeonScene.ts` | Zindan safe zone olusturma |

## SafeZone Sinifi

```typescript
class SafeZone {
  center: Vector3   // Merkezx noktasi
  radius: number    // Yaricap (XZ duzleminde)

  isInside(pos: Vector3): boolean  // Y yok sayilir, sadece XZ mesafesi
}
```

## SafeZoneRegistry (Global)

Statik sinif — tum sahnelerde tek kaynak.

| Metod | Aciklama |
|-------|----------|
| `addZone(zone)` | Yeni safe zone ekle |
| `removeAll()` | Tum zone'lari temizle (sahne gecisi) |
| `isPositionSafe(pos)` | Pozisyon herhangi bir zone icinde mi? |

## EnemyAI Entegrasyonu

Her frame'de `update()` icerisinde `playerSafe` flag'i hesaplanir:

```
playerSafe = SafeZoneRegistry.isPositionSafe(playerPos)
```

Bu flag asagidaki state'lere parametre olarak gecer:

| AI State | Davranis |
|----------|----------|
| IDLE | `playerSafe = true` → CHASE'e gecme, dolasmaya devam et |
| PATROL | `playerSafe = true` → CHASE'e gecme, devriyeye devam et |
| CHASE | `playerSafe = true` → RETURN state'e gec (geri don) |
| ATTACK | `playerSafe = true` → RETURN state'e gec (saldiriyi kes) |
| RETURN | Degismez (zaten geri donuyor) |

## Sahne Ayarlari

### TestScene (Ana Dunya)
- **Merkez:** (0, 0, 0) — oyuncu spawn noktasi
- **Yaricap:** 8 birim
- **Renk:** Mor (#A855F7) — Solo Leveling temasi

### DungeonScene (Zindan)
- **Merkez:** (0, 0, -(arenaSize/4)) — oyuncu spawn pozisyonu
- **Yaricap:** 6 birim
- **Renk:** Mavi (#5EA6F8) — zindan temasi

## Gorsel

Her safe zone iki mesh'ten olusur:
1. **Torus (halka):** Kenar cizgisi, emissive renk, alpha=0.6
2. **Disc (daire):** Ic alan, emissive renk, alpha=0.08 (cok saydam)

Her ikisi de `backFaceCulling = false` — her acidan gorunur.

## Yasam Dongusu

```
onLoad()
  └─ setupSafeZone(scene)
       ├─ SafeZoneRegistry.removeAll()   // Onceki zone'lari temizle
       ├─ new SafeZone(center, radius)   // Zone olustur
       ├─ SafeZoneRegistry.addZone(zone) // Registry'ye ekle
       └─ createSafeZoneMesh(...)        // Gorsel olustur

onExit()
  ├─ safeZoneMesh.dispose()             // Mesh temizle
  └─ SafeZoneRegistry.removeAll()       // Registry temizle
```

## Onemli Notlar

- Safe zone sadece **oyuncuyu** korur — golge askerleri safe zone disinda savasmaya devam eder
- Dusman safe zone **icine** giremez ama zone **kenarindan** saldirmaya calisabilir (menzil kontrolu sayesinde giremez)
- Sahne gecislerinde `removeAll()` cagirilir — zone sizdirmasi olmaz
- Registry statik oldugu icin hicbir yerde instance tasimanin geregi yok
