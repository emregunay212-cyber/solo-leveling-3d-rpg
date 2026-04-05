# Solo Leveling 3D RPG

Solo Leveling animesinden esinlenen, tarayicida calisan 3D hack & slash RPG oyunu.

## Mevcut Ozellikler

### Savas Sistemi (Metin2 Tarzi)
- **Space / Sol tik**: Kilic saldirisi (basili tut = surekli vurus)
- **Combo sistemi**: 3 vuruslu combo zinciri (Hit 1 → Hit 2 → Finisher)
- **Cift tik hedefleme**: Dusmana cift tikla → otomatik yanina yuru + olene kadar vur
- **Hasar sayilari**: Havada ucan renkli rakamlar (beyaz/sari/kirmizi)
- **Kritik vurus, backstab, parry, block** mekanikleri

### Hareket
- **WASD**: Yurume | **Shift**: Kosma | **C**: Dodge
- **Sag tik (tikla)**: Tiklanan noktaya yuru
- **Sag tik (surukle)**: Kamera dondurme
- **Fare tekerlegi**: Zoom

### Yetenek Sistemi (Q/E/R/F)
- **Q**: Golge Bicagi (dash saldiri, STR bazli)
- **E**: Golge Kalkani (%60 hasar azaltma buffi)
- **R**: Golge Patlama (AoE, INT bazli)
- **F**: Hukumdar Aurasi (ultimate, yavaslatma + hasar)
- Boss'lardan yeni yetenekler ogrenilir ve slot'lara atanir
- Yetenek kitaplari ile mevcut yetenekler guclendirilir (+%15 hasar, -%5 cooldown)

### Golge Ordusu (Shadow Army)
- **Alt + Sol tik** (olu dusman): Golge cikarma (ARISE)
- **Alt + 1/2/3/4**: Stoktan golge cagirma (secim paneli ile)
- **1/2/3/4 + Sol tik**: Golgeyi stoka alma
- **G**: Saldiri/Savunma modu degistirme
- Her golge kaynak dusmanin yeteneklerini kullanir
- Golge stat'lari oyuncunun derived stat'larindan yuzde kopyalar
- Boss golgeleri rank atlayabilir (Asker → Sovalye → Elit → Komutan)
- Normal golgeler karakter guclendikce otomatik guclenir
- Kill degeri dusman seviye/tipine gore degisir
- Golge isim etiketi (ustunde gorunur)
- Tab ile golge yonetim paneli

### Dungeon Gate Sistemi
- Portal'a yaklas → dungeon secim paneli
- 6 rank: E → D → C → B → A → S
- Her rank'ta farkli canavarlar ve boss
- Stat carpani: E(x1) → S(x10)
- Boss tum normaller olunce spawn olur
- Cikis portali her zaman acik (erken cikis mumkun)
- Boss olunce zafer portali aciilir
- Dungeon cooldown sistemi (ard arda kasilma engeli)
- Olum cezasi: XP/item kaybi, seviye dusebilir
- "Sehirde dog" = tum dungeon loot silinir

### Oyuncu Rank Sistemi
- Rank, ogrenilen yeteneklerin toplam gucune gore otomatik belirlenir
- Ranksiz → E → D → C → B → A → S
- Max 2 rank ustu dungeon'a girebilir (cok zor)
- 3+ rank ustu: girileMEZ

### Passive Kitaplar
- **Karanlik Yenilenme**: HP regen (her kitap = +%0.6 maxHP/sn)
- **Demir Irade**: Hasar azaltma (her kitap = +%5, max %25)

### Ilerleme Sistemi
- XP + Seviye (max 100, Metin2 tarzi agir grind)
- Stat dagitimi (P tusu): Guc, Dayaniklilik, Ceviklik, Zeka
- Gold kazanma ve dukkan sistemi
- Drop sistemi (dusmanlardan yetenek kitabi)

### Dusman Cesitleri
| Dusman | Seviye | Boss | Golge Yeteneği |
|--------|--------|------|---------------|
| Goblin | 1 | - | Hizli Saldiri |
| Kurt | 3 | - | Suru Gucu |
| Iskelet | 4 | - | Zehirli Darbe |
| Ork | 5 | - | Agir Darbe + Sert Deri |
| Kara Sovalye | 8 | ★ | Kalkan + Golge Bicak |
| Seytan | 12 | ★ | Can Emme + Cehennem Atesi |

### Dungeon Boss'lari
| Boss | Rank | HP | Ozel |
|------|------|----|------|
| Goblin Krali | E | 400 | Hizli + Suru |
| Iskelet Lordu | D | 800 | Zehir + Kalkan |
| Ork Savaslordsu | C | 1500 | Agir + Sert + Cleave |
| Karanlik Buyucu | B | 3000 | Kalkan + Ates + Emme |
| Iblis Lordu | A | 6000 | Ates + Emme + Cleave |
| Golge Hukumdari | S | 15000 | Tum yetenekler |

### Dev Konsol (F12)
- `setLevel(n)`, `addXp(n)`, `heal()`, `god()`, `kill()`, `stats()`
- `setStat('str', n)`, `addStatPoints(n)`

## Teknoloji
- **Motor**: Babylon.js v9 (WebGL2) + Havok Physics
- **Build**: Vite + TypeScript (strict mode)
- **Test**: Vitest

## Kurulum
```bash
npm install
npm run dev     # gelistirme
npm run build   # uretim
```

## Proje Yapisi
```
src/
├── core/        # Motor, girdi, sahne, event sistemi
├── player/      # Oyuncu hareketi, kamera, savas
├── combat/      # Savas sistemi, combo, hasar
├── enemies/     # Dusman AI, canavar tanimlari
├── progression/ # XP, seviye, stat, oyuncu rank
├── skills/      # Yetenek sistemi, skill tanimlari
├── shadows/     # Golge ordusu, profil, AI, stat hesaplama
├── dungeon/     # Dungeon tanimlari, yonetici, cooldown
├── systems/     # Envanter, drop, respawn, dev konsol
├── ui/          # HUD, paneller, dungeon UI
├── scenes/      # TestScene (acik dunya), DungeonScene
├── config/      # Merkezi oyun konfigurasyon
└── data/        # Canavar, boss, yetenek, drop tanimlari
```

## Yol Haritasi

- [x] Faz 1: Temel altyapi (motor, hareket, fizik)
- [x] Faz 2: Savas sistemi (combo, hasar, auto-attack, parry, block)
- [x] Faz 3: Dusmanlar (AI, spawn, XP/seviye, 6 canavar tipi)
- [x] Faz 4: Yetenek sistemi (Q/E/R/F) + Golge Ordusu (cikarma, rank, yetenekler, stat kopyalama, savas modlari, isim etiketi, stok secici, yetenek kitaplari)
- [x] Faz 5: Dungeon Gate sistemi + Oyuncu Rank + Boss'lar + Cooldown + Olum cezasi
- [ ] Faz 6: Sehir + NPC + Dukkan (guvenli bolge, NPC'ler, gelismis dukkan)
- [ ] Faz 7: Oyuncu Ekipman Sistemi (silah, zirh, aksesuar, craft)
- [ ] Faz 8: Quest Sistemi (gunluk/haftalik gorevler, odulller)
- [ ] Faz 9: Save/Load + Dil secimi (localStorage, coklu dil)
- [ ] Faz 10: PvP Arena / Cok oyunculu (gelecek)

## Lisans
MIT
