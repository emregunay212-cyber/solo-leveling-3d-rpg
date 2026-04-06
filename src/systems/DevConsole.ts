/**
 * Gelistirici konsolu — tarayici konsolundan debug komutlari.
 *
 * Kullanim (tarayici konsolunda):
 *   setLevel(50)    → Oyuncuyu level 50'ye cikar
 *   addXp(5000)     → 5000 XP ekle
 *   heal()          → HP/MP full
 *   god()           → Olümsuzluk aç/kapa
 *   kill()          → Tum dusmanlari öldür
 *   stats()         → Mevcut istatistikleri göster
 *
 * Kaldirmak icin:
 *   1) TestScene'deki DevConsole import & init satirlarini sil
 *   2) Bu dosyayi sil
 *   Baska hicbir dosyaya dokunmana gerek yok.
 */

import type { LevelSystem } from '../progression/LevelSystem';
import type { PlayerController } from '../player/PlayerController';
import type { PlayerCombat } from '../player/PlayerCombat';
import type { Enemy } from '../enemies/Enemy';

interface DevDeps {
  readonly levelSystem: LevelSystem;
  readonly player: PlayerController;
  readonly combat: PlayerCombat;
  readonly getEnemies: () => readonly Enemy[];
  readonly getHp: () => number;
  readonly getMp: () => number;
  readonly setHp: (v: number) => void;
  readonly setMp: (v: number) => void;
  readonly applyStats?: () => void;
  readonly teleportTo?: (x: number, y: number, z: number) => void;
  readonly enterDungeon?: (rank: string) => void;
}

interface DevWindow {
  setLevel: (lv: number) => void;
  addXp: (amount: number) => void;
  heal: () => void;
  god: () => void;
  kill: () => void;
  stats: () => void;
  setStat: (stat: string, value: number) => void;
  addStatPoints: (amount: number) => void;
  setDamage: (dmg: number) => void;
  tp: (x: number, y: number, z: number) => void;
  dungeon: (rank: string) => void;
  _devConsoleCleanup?: () => void;
}

export function initDevConsole(deps: DevDeps): void {
  const w = window as unknown as DevWindow;
  let godMode = false;

  w.setLevel = (lv: number) => {
    deps.levelSystem.setLevel(lv);
    deps.setHp(deps.levelSystem.getMaxHp());
    deps.setMp(deps.levelSystem.getMaxMp());
    console.log(`[DEV] Level → ${deps.levelSystem.level} | HP ${deps.levelSystem.getMaxHp()} | MP ${deps.levelSystem.getMaxMp()} | Stat pts: ${deps.levelSystem.statPoints}`);
  };

  w.addXp = (amount: number) => {
    deps.levelSystem.addXp(amount);
    console.log(`[DEV] +${amount} XP → Level ${deps.levelSystem.level} (${deps.levelSystem.xp}/${deps.levelSystem.xpToNext})`);
  };

  w.heal = () => {
    deps.setHp(deps.levelSystem.getMaxHp());
    deps.setMp(deps.levelSystem.getMaxMp());
    console.log('[DEV] Full heal');
  };

  w.god = () => {
    godMode = !godMode;
    console.log(`[DEV] God mode: ${godMode ? 'ON' : 'OFF'}`);
  };

  w.kill = () => {
    const enemies = deps.getEnemies();
    let killed = 0;
    for (const e of enemies) {
      if (e.isAlive()) {
        e.takeDamage(999999, false, e.mesh.position);
        killed++;
      }
    }
    console.log(`[DEV] Killed ${killed} enemies`);
  };

  w.stats = () => {
    const ls = deps.levelSystem;
    console.table({
      level: ls.level,
      xp: `${ls.xp} / ${ls.xpToNext}`,
      statPoints: ls.statPoints,
      str: ls.str,
      vit: ls.vit,
      agi: ls.agi,
      int: ls.int,
      maxHp: ls.getMaxHp(),
      maxMp: ls.getMaxMp(),
      attack: ls.getAttackDamage(),
      critChance: `${(ls.getCritChance() * 100).toFixed(1)}%`,
      attackSpeed: ls.getAttackSpeed().toFixed(2),
      defense: ls.getDefense(),
      mpRegen: `${ls.getMpRegen().toFixed(1)}/s`,
    });
  };

  w.setStat = (stat: string, value: number) => {
    const valid = ['str', 'vit', 'agi', 'int'] as const;
    const s = stat.toLowerCase() as typeof valid[number];
    if (!valid.includes(s)) {
      console.log(`[DEV] Gecersiz stat. Kullanim: setStat('str', 50)  — str, vit, agi, int`);
      return;
    }
    (deps.levelSystem as unknown as Record<string, number>)[s] = value;
    if (deps.applyStats) deps.applyStats();
    deps.setHp(deps.levelSystem.getMaxHp());
    deps.setMp(deps.levelSystem.getMaxMp());
    console.log(`[DEV] ${s.toUpperCase()} → ${value} | Saldiri ${deps.levelSystem.getAttackDamage()} | HP ${deps.levelSystem.getMaxHp()} | MP ${deps.levelSystem.getMaxMp()}`);
  };

  w.addStatPoints = (amount: number) => {
    deps.levelSystem.statPoints += amount;
    console.log(`[DEV] +${amount} stat puani → Toplam: ${deps.levelSystem.statPoints}`);
  };

  w.setDamage = (dmg: number) => {
    deps.combat.setBaseDamage(dmg);
    console.log(`[DEV] Saldiri hasari → ${dmg} (gecici — faz sonunda kaldirilacak)`);
  };

  w.tp = (x: number, y: number, z: number) => {
    if (deps.teleportTo) {
      deps.teleportTo(x, y, z);
      console.log(`[DEV] Teleport → (${x}, ${y}, ${z})`);
    } else {
      console.log('[DEV] Teleport desteklenmiyor');
    }
  };

  w.dungeon = (rank: string) => {
    if (deps.enterDungeon) {
      deps.enterDungeon(rank.toUpperCase());
      console.log(`[DEV] Dungeon → ${rank.toUpperCase()}-Rank`);
    } else {
      console.log('[DEV] Dungeon girisi desteklenmiyor');
    }
  };

  // Temizlik fonksiyonu
  w._devConsoleCleanup = () => {
    delete (w as Partial<DevWindow>).setLevel;
    delete (w as Partial<DevWindow>).addXp;
    delete (w as Partial<DevWindow>).heal;
    delete (w as Partial<DevWindow>).god;
    delete (w as Partial<DevWindow>).kill;
    delete (w as Partial<DevWindow>).stats;
    delete (w as Partial<DevWindow>).setStat;
    delete (w as Partial<DevWindow>).addStatPoints;
    delete (w as Partial<DevWindow>).setDamage;
    delete (w as Partial<DevWindow>).tp;
    delete (w as Partial<DevWindow>).dungeon;
    delete (w as Partial<DevWindow>)._devConsoleCleanup;
  };

  console.log(
    '%c[DEV CONSOLE] %cKomutlar: setLevel(n), addXp(n), heal(), god(), kill(), stats(), setStat(stat,n), addStatPoints(n), tp(x,y,z), dungeon(rank)',
    'color: #c084fc; font-weight: bold',
    'color: #888',
  );
}

export function disposeDevConsole(): void {
  const w = window as unknown as DevWindow;
  if (w._devConsoleCleanup) w._devConsoleCleanup();
}
