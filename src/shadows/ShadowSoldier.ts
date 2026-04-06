import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Ray } from '@babylonjs/core/Culling/ray';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ShadowAI } from './ShadowAI';
import type { ShadowCombatMode } from './ShadowAI';
import { ShadowSkillRunner } from './ShadowSkillRunner';
import { SHADOW, ENEMY_VISUAL } from '../config/GameConfig';
import { calculateShadowStats } from './ShadowStatCalculator';
import type { ShadowProfile, ShadowFinalStats, PlayerStats } from './ShadowEnhancementTypes';
import type { DamageNumbers } from '../combat/DamageNumbers';
import type { EnemyDef } from '../enemies/Enemy';
import type { Enemy } from '../enemies/Enemy';
import type { GameContext } from '../core/GameContext';

/**
 * Golge asker entity.
 * Olen dusmanin golgesi — oyuncuyu takip eder, dusmanlara saldirir.
 * Statlar oyuncu statlarindan yuzde kopyalanir.
 */
export class ShadowSoldier {
  private static nextId = 0;

  public mesh: Mesh;
  public position: Vector3;
  public hp: number;
  public maxHp: number;
  public damage: number;
  public def: EnemyDef;
  public ai: ShadowAI;

  private scene: Scene;
  private id: number;
  private mat: StandardMaterial;
  private hpBarBg: Mesh;
  private hpBarFill: Mesh;
  private fillMat: StandardMaterial;
  private hpBarBgMat!: StandardMaterial;
  private isDead = false;
  private isStocked = false;
  private damageNumbers: DamageNumbers | null = null;
  private isSelected = false;
  private profile: ShadowProfile | null = null;
  public finalStats: ShadowFinalStats | null = null;
  private skillRunner: ShadowSkillRunner | null = null;
  private onKillCallback: ((uid: number, enemyLevel: number, isBoss: boolean) => void) | null = null;
  private nameLabel: Mesh;
  private nameLabelTexture: DynamicTexture;
  private nameLabelMat: StandardMaterial;

  constructor(
    scene: Scene,
    spawnPos: Vector3,
    sourceDef: EnemyDef,
    playerStats: PlayerStats,
    profile?: ShadowProfile,
  ) {
    this.scene = scene;
    this.def = sourceDef;
    this.id = ShadowSoldier.nextId++;
    this.profile = profile ?? null;

    // Stat hesaplama: oyuncu statlarindan yuzde kopyalama
    const stats = calculateShadowStats(sourceDef, this.profile, playerStats);
    this.finalStats = stats;
    this.maxHp = stats.maxHp;
    this.damage = stats.damage;

    // Profil varsa HP yuzdesinden baslat
    this.hp = this.profile
      ? Math.round(this.maxHp * Math.max(0.01, this.profile.hpPercent))
      : this.maxHp;

    this.position = spawnPos.clone();

    // Mesh — orijinal dusmanin mor kopyasi
    const scale = sourceDef.scale * SHADOW.shadowScale;
    this.mesh = MeshBuilder.CreateCapsule(`shadow_${this.id}`, {
      height: ENEMY_VISUAL.bodyHeightMultiplier * scale,
      radius: ENEMY_VISUAL.bodyRadiusMultiplier * scale,
    }, scene);
    this.mesh.position = spawnPos.clone();
    this.mesh.position.y += ENEMY_VISUAL.meshYOffsetMultiplier * scale;

    // Mor golge materyali
    this.mat = new StandardMaterial(`shadowMat_${this.id}`, scene);
    this.mat.diffuseColor = new Color3(SHADOW.color.r, SHADOW.color.g, SHADOW.color.b);
    this.mat.emissiveColor = new Color3(SHADOW.emissive.r, SHADOW.emissive.g, SHADOW.emissive.b);
    this.mat.alpha = SHADOW.alpha;
    this.mesh.material = this.mat;

    // HP bar (mor)
    this.hpBarBg = MeshBuilder.CreatePlane(`shpBg_${this.id}`, {
      width: ENEMY_VISUAL.hpBarWidth, height: ENEMY_VISUAL.hpBarHeight,
    }, scene);
    this.hpBarBg.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.hpBarBg.isPickable = false;
    this.hpBarBgMat = new StandardMaterial(`shpBgMat_${this.id}`, scene);
    this.hpBarBgMat.diffuseColor = new Color3(0.1, 0.05, 0.15);
    this.hpBarBgMat.emissiveColor = new Color3(0.05, 0.02, 0.08);
    this.hpBarBgMat.disableLighting = true;
    this.hpBarBgMat.backFaceCulling = false;
    this.hpBarBg.material = this.hpBarBgMat;

    this.hpBarFill = MeshBuilder.CreatePlane(`shpFill_${this.id}`, { width: 0.95, height: 0.07 }, scene);
    this.hpBarFill.parent = this.hpBarBg;
    this.hpBarFill.position.set(0, 0, -0.001);
    this.hpBarFill.isPickable = false;
    this.fillMat = new StandardMaterial(`shpFillMat_${this.id}`, scene);
    this.fillMat.diffuseColor = new Color3(SHADOW.hpBarColor.r, SHADOW.hpBarColor.g, SHADOW.hpBarColor.b);
    this.fillMat.emissiveColor = new Color3(0.2, 0.05, 0.3);
    this.fillMat.disableLighting = true;
    this.fillMat.backFaceCulling = false;
    this.hpBarFill.material = this.fillMat;

    // Isim etiketi — HP barin ustunde kucuk billboard plane
    const labelPlane = MeshBuilder.CreatePlane(`shadowLabel_${this.id}`, { width: 1.2, height: 0.3 }, scene);
    labelPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    labelPlane.isPickable = false;
    this.nameLabel = labelPlane;

    const labelTex = new DynamicTexture(`shadowLabelTex_${this.id}`, { width: 256, height: 64 }, scene);
    this.nameLabelTexture = labelTex;
    const labelMat = new StandardMaterial(`shadowLabelMat_${this.id}`, scene);
    labelMat.diffuseTexture = labelTex;
    labelMat.emissiveTexture = labelTex;
    labelMat.opacityTexture = labelTex;
    labelMat.disableLighting = true;
    labelMat.backFaceCulling = false;
    this.nameLabelMat = labelMat;
    labelPlane.material = labelMat;

    // Etiket metnini ciz
    const labelCtx = labelTex.getContext() as CanvasRenderingContext2D;
    labelCtx.clearRect(0, 0, 256, 64);
    labelCtx.font = 'bold 24px Arial';
    labelCtx.textAlign = 'center';
    labelCtx.textBaseline = 'middle';
    labelCtx.fillStyle = '#c084fc';
    const displayName = profile?.nickname ?? sourceDef.name;
    const rankSuffix = profile?.isBoss ? ` [${profile.rank[0].toUpperCase()}]` : '';
    const bossPrefix = profile?.isBoss ? '\u2605 ' : '';
    labelCtx.fillText(bossPrefix + displayName + rankSuffix, 128, 32);
    labelTex.update();

    // Yetenek sistemi — profilden veya kaynak dusmanin sabit yeteneklerinden
    const skillIds = this.profile?.shadowSkillIds ?? sourceDef.shadowSkillIds ?? [];
    if (skillIds.length > 0) {
      this.skillRunner = new ShadowSkillRunner(skillIds);
    }

    // AI — profil statlari varsa konfigurasyona aktar
    // Saldiri hizi bonusunu cooldown'a uygula
    const baseAttackCooldown = this.finalStats?.attackCooldown ?? 2.0;
    const attackSpeedBonus = this.skillRunner?.getAttackSpeedBonus() ?? 0;
    const effectiveAttackCooldown = Math.max(0.3, baseAttackCooldown * (1 - attackSpeedBonus));

    this.ai = new ShadowAI(
      effectiveAttackCooldown,
      this.finalStats?.chaseSpeed,
      this.finalStats?.patrolSpeed,
    );
  }

  public update(ctx: GameContext, enemies: Enemy[], otherShadowPositions: Vector3[] = []): void {
    if (this.isDead) return;
    const dt = ctx.deltaTime;
    const scale = this.def.scale * SHADOW.shadowScale;

    // Skill runner tick (cooldown + buff sureleri)
    if (this.skillRunner) {
      this.skillRunner.update(dt);

      // Periyodik iyilesme
      const periodicHeal = this.skillRunner.getPeriodicHeal(this.maxHp);
      if (periodicHeal > 0 && this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + periodicHeal);
        this.hpBarFill.scaling.x = Math.max(0.01, this.hp / this.maxHp);
      }

      // Periyodik AoE hasar (Cehennem Atesi vb.)
      const periodicAoe = this.skillRunner.getPeriodicAoeDamage(this.damage);
      if (periodicAoe.damage > 0 && periodicAoe.aoeRadius > 0) {
        for (const enemy of enemies) {
          if (!enemy.isAlive()) continue;
          const dist = enemy.mesh.position.subtract(this.position).length();
          if (dist <= periodicAoe.aoeRadius) {
            enemy.takeDamage(periodicAoe.damage, false, this.position, true);
            if (this.damageNumbers) {
              this.damageNumbers.spawn(
                enemy.mesh.position.add(new Vector3(0, 1.5, 0)),
                periodicAoe.damage, 'skill',
              );
            }
          }
        }
      }

      // Shadow Step: dusmanin arkasina isinlan
      if (this.skillRunner.shouldTeleportBehind()) {
        const target = this.ai.getCurrentTarget();
        if (target && target.isAlive()) {
          const behindDir = new Vector3(
            -Math.sin(target.getRotationY()),
            0,
            -Math.cos(target.getRotationY()),
          );
          this.position.x = target.mesh.position.x + behindDir.x * 1.5;
          this.position.z = target.mesh.position.z + behindDir.z * 1.5;
        }
      }
    }

    // AI update (diger golge pozisyonlari ile separation)
    this.ai.update(dt, this.position, ctx.player.position, enemies, otherShadowPositions);

    // Saldiri + hasar sayisi goster
    if (this.ai.shouldAttack()) {
      const target = this.ai.getCurrentTarget();
      if (target && target.isAlive()) {
        // Aktif buff'lardan bonus hasar hesapla
        const bonusPercent = this.skillRunner?.getActiveBonusDamagePercent() ?? 0;
        const effectiveDamage = Math.round(this.damage * (1 + bonusPercent));

        // Yakin golge sayisini hesapla (pack_bonus icin)
        const nearbyAllies = otherShadowPositions.filter(
          p => this.position.subtract(p).length() < 5,
        ).length;
        // Skill tetikleme: onAttack (Shadow Cleave AoE vb.)
        const attackResult = this.skillRunner?.onAttack(target, this.position, effectiveDamage, nearbyAllies);
        const totalDamage = effectiveDamage + (attackResult?.bonusDamage ?? 0);

        target.takeDamage(totalDamage, false, this.position, true);
        this.ai.resetAttackTimer();

        // Lifesteal iyilesmesi
        const lifestealHeal = this.skillRunner?.getLifestealHeal(totalDamage) ?? 0;
        if (lifestealHeal > 0 && this.hp < this.maxHp) {
          this.hp = Math.min(this.maxHp, this.hp + lifestealHeal);
          this.hpBarFill.scaling.x = Math.max(0.01, this.hp / this.maxHp);
          // Gorsel geri bildirim: yesil iyilesme sayisi
          if (this.damageNumbers) {
            this.damageNumbers.spawn(
              this.mesh.position.add(new Vector3(0, 2.0, 0)),
              lifestealHeal, 'parry',
            );
          }
        }

        if (this.damageNumbers) {
          this.damageNumbers.spawn(
            target.mesh.position.add(new Vector3(0, 1.5, 0)),
            totalDamage, 'skill',
          );
        }

        // Hedef oldu mu? onKill tetikle
        if (!target.isAlive()) {
          if (this.skillRunner) {
            this.skillRunner.onKill();
          }
          if (this.profile && this.onKillCallback) {
            this.onKillCallback(this.profile.uid, target.def.level, target.def.isBoss);
          }
        }
      }
    }

    // Hareket
    const vel = this.ai.velocity;
    if (vel.lengthSquared() > 0.01) {
      this.position.x += vel.x * dt;
      this.position.z += vel.z * dt;
    }

    // Zemin
    const floorY = this.getFloorY();
    this.position.y = floorY;

    // Mesh sync
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y + ENEMY_VISUAL.meshYOffsetMultiplier * scale;
    this.mesh.position.z = this.position.z;

    // HP bar
    this.hpBarBg.position.x = this.mesh.position.x;
    this.hpBarBg.position.y = this.mesh.position.y + ENEMY_VISUAL.hpBarYOffsetMultiplier * scale;
    this.hpBarBg.position.z = this.mesh.position.z;

    // Isim etiketi — HP barin 0.15 yukari
    this.nameLabel.position.x = this.mesh.position.x;
    this.nameLabel.position.y = this.hpBarBg.position.y + 0.15;
    this.nameLabel.position.z = this.mesh.position.z;

    // Yonu dusmana cevir
    if (vel.lengthSquared() > 0.01) {
      this.mesh.rotation.y = Math.atan2(vel.x, vel.z);
    }
  }

  /** Oyuncu statlari degistiginde golge statlarini yeniden hesapla */
  public recalculateStats(playerStats: PlayerStats): void {
    const stats = calculateShadowStats(this.def, this.profile, playerStats);
    this.finalStats = stats;

    // HP oranini koru
    const hpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    this.maxHp = stats.maxHp;
    this.hp = Math.max(1, Math.round(this.maxHp * hpRatio));
    this.damage = stats.damage;

    // HP bar guncelle
    this.hpBarFill.scaling.x = Math.max(0.01, this.hp / this.maxHp);
  }

  /** Stoktan cikarken HP yuzdesini ayarla */
  public setHpPercent(percent: number): void {
    this.hp = Math.round(this.maxHp * Math.max(0.01, Math.min(1, percent)));
    this.hpBarFill.scaling.x = Math.max(0.01, this.hp / this.maxHp);
  }

  public setDamageNumbers(dn: DamageNumbers): void {
    this.damageNumbers = dn;
  }

  /** Savas modunu AI'a aktar */
  public setMode(mode: ShadowCombatMode): void {
    this.ai.setMode(mode);
  }

  /** Secim gorseli — seciliyken parlak mor kenar */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    if (selected) {
      this.mat.emissiveColor = new Color3(0.6, 0.2, 1.0);
    } else {
      this.mat.emissiveColor = new Color3(SHADOW.emissive.r, SHADOW.emissive.g, SHADOW.emissive.b);
    }
  }

  public getIsSelected(): boolean { return this.isSelected; }

  /** Stoklandı olarak işaretle — profil silinmesini engeller */
  public markAsStocked(): void { this.isStocked = true; }
  public getIsStocked(): boolean { return this.isStocked; }

  /** Oyuncu tarafindan zorla hedef ata */
  public forceTarget(enemy: Enemy): void {
    this.ai.forceTarget(enemy);
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;

    let finalDamage = amount;

    // Savunma: profil bazli defense ve blockChance uygula
    if (this.finalStats) {
      finalDamage = Math.max(1, finalDamage - this.finalStats.defense);

      if (this.finalStats.blockChance > 0 && Math.random() < this.finalStats.blockChance) {
        finalDamage = Math.max(1, Math.round(finalDamage * 0.5));
      }
    }

    // Skill bazli hasar azaltma
    if (this.skillRunner) {
      finalDamage = this.skillRunner.onTakeDamage(finalDamage);
    }

    this.hp = Math.max(0, this.hp - finalDamage);
    this.hpBarFill.scaling.x = Math.max(0.01, this.hp / this.maxHp);

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;
    this.ai.onDeath();
    this.mesh.isVisible = false;
    this.hpBarBg.isVisible = false;
    this.nameLabel.isVisible = false;
  }

  public isAlive(): boolean { return !this.isDead; }

  private getFloorY(): number {
    const origin = new Vector3(this.position.x, this.position.y + 1, this.position.z);
    const ray = new Ray(origin, Vector3.Down(), 50);
    const hit = this.scene.pickWithRay(ray, (m) => {
      return m !== this.mesh && m.isPickable && m.isEnabled() &&
        !m.name.startsWith('shadow_') && !m.name.startsWith('shp') &&
        !m.name.startsWith('enemy_') && !m.name.startsWith('ehp') &&
        !m.name.startsWith('dmgNum') && !m.name.startsWith('clickRing') &&
        !m.name.startsWith('playerBody');
    });
    return hit?.hit && hit.pickedPoint ? hit.pickedPoint.y : 0;
  }

  /** Profilin guncel HP yuzdesiyle kopyasini dondur */
  public getProfile(): ShadowProfile | null {
    if (!this.profile) return null;
    return { ...this.profile, hpPercent: this.maxHp > 0 ? this.hp / this.maxHp : 0 };
  }

  /** Kill callback'i ayarla — ShadowArmy profil yoneticisine baglar */
  public setOnKill(cb: (uid: number, enemyLevel: number, isBoss: boolean) => void): void {
    this.onKillCallback = cb;
  }

  /** Hedef olduruldu — ordu veya AI tarafindan cagirilir */
  public onTargetKilled(): void {
    // Profil varsa kill sayacini artirmak icin uid saklanir;
    // gercek artirma ShadowArmy veya dis sistem tarafindan profileManager uzerinden yapilir
  }

  public dispose(): void {
    this.mesh.dispose();
    this.hpBarBg.dispose();
    this.hpBarFill.dispose();
    this.mat.dispose();
    this.fillMat.dispose();
    this.hpBarBgMat.dispose();
    this.nameLabel.dispose();
    this.nameLabelTexture.dispose();
    this.nameLabelMat.dispose();
  }
}
