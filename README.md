# Solo Leveling 3D RPG

Solo Leveling animesinden esinlenen, tarayicida calisan 3D hack & slash RPG oyunu.

## Ozellikler

### Savas Sistemi (Metin2 Tarzi)
- **Space / Sol tik**: Kilic saldirisi (basili tut = surekli vurus)
- **Combo sistemi**: 3 vuruslu combo zinciri (Hit 1 → Hit 2 → Finisher)
- **Cift tik hedefleme**: Dusmana cift tikla → otomatik yanina yuru + olene kadar vur
- **Hasar sayilari**: Havada ucan renkli rakamlar (beyaz/sari/kirmizi)

### Hareket
- **WASD**: Yurume
- **Shift**: Kosma
- **C**: Dodge (kayarak kacinma)
- **Sag tik (tikla)**: Tiklanan noktaya yuru (dalga efekti ile)
- **Sag tik (basili tut + surukle)**: Kamera dondurme
- **Fare tekerlegi**: Yakinlastir / Uzaklastir

### Dusman AI
- 6 canavar tipi: Goblin, Kurt, Ork, Iskelet, Kara Sovalye, Seytan
- AI durum makinesi: Dolasma → Kovalama → Saldiri → Geri Donme
- Her canavar turune ozel HP, hasar, XP odulu
- Oldurulen canavarlar 15 saniye sonra yeniden dogar

### Ilerleme Sistemi
- **XP + Seviye**: Canavar oldurme ile XP kazan, seviye atla (max 100)
- **Stat dagitimi** (P tusu): Guc, Dayaniklilik, Ceviklik, Zeka
- **Stat siniri**: Her stat max 90 - geri kalani ekipman/yetenek ile
- **Gold**: Canavarlardan gold kazan

### Stat Etkileri
| Stat | Etki |
|------|------|
| Guc (STR) | Saldiri hasari (max 190) |
| Dayaniklilik (VIT) | Maksimum HP (max 800) |
| Ceviklik (AGI) | Kritik sans (%40), saldiri hizi (x2.0), hareket hizi |
| Zeka (INT) | Maksimum MP (max 480), skill gucu |

### UI
- HP / MP / XP cubugu
- Seviye ve Gold gostergesi
- Dusman HP cubugu (renk degisimli)
- Combo gostergesi
- Olum ekrani (2 secenek: burada yeniden dog / baslangicta yeniden dog)
- Karakter stat paneli (P tusu)

## Teknoloji

- **Motor**: [Babylon.js](https://www.babylonjs.com/) v9 (WebGL2)
- **Fizik**: [Havok](https://www.havok.com/) (WASM)
- **Build**: [Vite](https://vitejs.dev/) + TypeScript
- **Maliyet**: 0 TL - tamamen ucretsiz acik kaynak araclar

## Kurulum

```bash
# Bagimliliklari yukle
npm install

# Gelistirme sunucusu baslat
npm run dev

# Uretim build'i olustur
npm run build
```

## Proje Yapisi

```
src/
├── core/        # Motor, girdi, sahne yonetimi, olay sistemi
├── player/      # Oyuncu hareketi, kamera, savas
├── combat/      # Savas sistemi, combo, hasar sayilari
├── enemies/     # Dusman AI, canavar tanimlari
├── progression/ # XP, seviye, stat sistemi
├── ui/          # HUD, stat paneli, olum ekrani
└── data/        # Canavar veri tanimlari
```

## Yol Haritasi

- [x] Faz 1: Temel altyapi (motor, hareket, fizik)
- [x] Faz 2: Savas sistemi (combo, hasar, auto-attack)
- [x] Faz 3: Dusmanlar (AI, spawn, XP/seviye)
- [ ] Faz 4: Yetenek sistemi (Q/W/E/R skill bar)
- [ ] Faz 5: Golge Ordusu (cikarma, askerler, evrim)
- [ ] Faz 6: Dungeon sistemi
- [ ] Faz 7: Sehir + NPC'ler
- [ ] Faz 8: Envanter + Ekipman
- [ ] Faz 9: Ilerleme + Gunluk gorevler
- [ ] Faz 10: Kaydet/Yukle + Dil secimi

## Lisans

MIT
