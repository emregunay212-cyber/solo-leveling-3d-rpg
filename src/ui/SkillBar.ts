import type { SkillState } from '../skills/SkillDef';
import type { ChargeLevel } from '../skills/ChargeSystem';

/**
 * Skill bar UI — Solo Leveling temali Q/E/R/F slotlari.
 */
export class SkillBar {
  private container: HTMLDivElement;
  private slotElements: Map<string, {
    wrapper: HTMLDivElement;
    cooldownOverlay: HTMLDivElement;
    cooldownText: HTMLSpanElement;
    upgradeBadge: HTMLSpanElement;
    chargeBar: HTMLDivElement;
    chargeFill: HTMLDivElement;
  }> = new Map();

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'skill-bar';
    this.container.innerHTML = `
      <style>
        #skill-bar {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
          pointer-events: none;
          z-index: 10;
        }
        .skill-slot {
          width: 54px;
          height: 54px;
          background: linear-gradient(180deg, rgba(15,6,30,0.92) 0%, rgba(10,4,22,0.95) 100%);
          border: 1.5px solid rgba(100,40,160,0.35);
          border-radius: 6px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          backdrop-filter: blur(4px);
        }
        .skill-slot.active {
          border-color: #a855f7;
          box-shadow:
            0 0 12px rgba(168,85,247,0.4),
            inset 0 0 8px rgba(168,85,247,0.1);
        }
        .skill-slot.no-mp {
          opacity: 0.35;
        }
        .skill-key {
          position: absolute;
          top: 3px; left: 5px;
          font-family: 'Orbitron', monospace;
          color: rgba(255,255,255,0.3);
          font-size: 9px;
          font-weight: 700;
        }
        .skill-slot.active .skill-key {
          color: rgba(192,132,252,0.8);
        }
        .skill-name {
          color: rgba(192,132,252,0.7);
          font-family: 'Rajdhani', sans-serif;
          font-size: 8px;
          font-weight: 600;
          text-align: center;
          line-height: 1.1;
          margin-top: 6px;
        }
        .skill-cost {
          position: absolute;
          bottom: 3px; right: 5px;
          font-family: 'Rajdhani', sans-serif;
          color: rgba(139,92,246,0.7);
          font-size: 9px;
          font-weight: 700;
        }
        .skill-cd-overlay {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%;
          background: rgba(0,0,0,0.75);
          border-radius: 0 0 5px 5px;
          display: none;
          transition: height 0.1s;
        }
        .skill-cd-text {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Orbitron', monospace;
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          font-weight: 700;
          text-shadow: 0 0 6px rgba(0,0,0,0.9);
          display: none;
        }
        .skill-upgrade-badge {
          position: absolute;
          top: 2px; right: 3px;
          font-family: 'Rajdhani', sans-serif;
          color: #fbbf24;
          font-size: 9px;
          font-weight: 700;
          text-shadow: 0 0 4px rgba(251,191,36,0.6);
          display: none;
        }
        .skill-slot.charging-tap  { border-color: rgba(150,70,255,0.7); }
        .skill-slot.charging-lv1  { border-color: #FFD700; box-shadow: 0 0 10px rgba(255,215,0,0.5); }
        .skill-slot.charging-max  { border-color: #FF4444; box-shadow: 0 0 14px rgba(255,68,68,0.7);
                                    animation: chargePulse 0.3s ease-in-out infinite; }
        .skill-slot.combo-ready   { box-shadow: 0 0 16px rgba(255,255,100,0.7), inset 0 0 8px rgba(255,255,0,0.15); }
        @keyframes chargePulse {
          0%,100% { box-shadow: 0 0 14px rgba(255,68,68,0.7); }
          50%      { box-shadow: 0 0 22px rgba(255,68,68,1.0); }
        }
        .skill-charge-bar {
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 0 0 5px 5px;
          overflow: hidden;
          display: none;
        }
        .skill-charge-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #5B0E91, #B06EFF);
          transition: width 0.05s linear, background 0.15s;
        }
      </style>
    `;

    document.body.appendChild(this.container);
  }

  public initSlots(slots: readonly SkillState[]): void {
    for (const slot of slots) {
      const keyLabel = slot.def.key.replace('Key', '');
      const wrapper = document.createElement('div');
      wrapper.className = 'skill-slot';
      wrapper.innerHTML = `
        <span class="skill-key">${keyLabel}</span>
        <span class="skill-upgrade-badge"></span>
        <span class="skill-name">${slot.def.name}</span>
        <span class="skill-cost">${slot.def.mpCost}</span>
        <div class="skill-cd-overlay" id="scd-ov-${slot.def.id}"></div>
        <span class="skill-cd-text" id="scd-tx-${slot.def.id}"></span>
        <div class="skill-charge-bar"><div class="skill-charge-fill"></div></div>
      `;
      this.container.appendChild(wrapper);

      this.slotElements.set(slot.def.id, {
        wrapper,
        cooldownOverlay: wrapper.querySelector('.skill-cd-overlay') as HTMLDivElement,
        cooldownText: wrapper.querySelector('.skill-cd-text') as HTMLSpanElement,
        upgradeBadge: wrapper.querySelector('.skill-upgrade-badge') as HTMLSpanElement,
        chargeBar: wrapper.querySelector('.skill-charge-bar') as HTMLDivElement,
        chargeFill: wrapper.querySelector('.skill-charge-fill') as HTMLDivElement,
      });
    }
  }

  /**
   * Slotlar degistiginde UI'i yeniden olusturur.
   * PlayerRankSystem'den gelen yetenek atamalari sonrasi cagirilir.
   */
  public refreshSlots(slots: readonly SkillState[]): void {
    // Eski slot elementlerini temizle
    for (const [, el] of this.slotElements) {
      el.wrapper.remove();
    }
    this.slotElements.clear();

    // Yeniden olustur
    for (const slot of slots) {
      const keyLabel = slot.def.key.replace('Key', '');
      const wrapper = document.createElement('div');
      wrapper.className = 'skill-slot';
      wrapper.innerHTML = `
        <span class="skill-key">${keyLabel}</span>
        <span class="skill-upgrade-badge"></span>
        <span class="skill-name">${slot.def.name}</span>
        <span class="skill-cost">${slot.def.mpCost}</span>
        <div class="skill-cd-overlay"></div>
        <span class="skill-cd-text"></span>
        <div class="skill-charge-bar"><div class="skill-charge-fill"></div></div>
      `;
      this.container.appendChild(wrapper);

      this.slotElements.set(slot.def.id, {
        wrapper,
        cooldownOverlay: wrapper.querySelector('.skill-cd-overlay') as HTMLDivElement,
        cooldownText: wrapper.querySelector('.skill-cd-text') as HTMLSpanElement,
        upgradeBadge: wrapper.querySelector('.skill-upgrade-badge') as HTMLSpanElement,
        chargeBar: wrapper.querySelector('.skill-charge-bar') as HTMLDivElement,
        chargeFill: wrapper.querySelector('.skill-charge-fill') as HTMLDivElement,
      });
    }
  }

  /** Charge durumunu guncelle */
  public updateCharge(
    skillId: string,
    chargeTime: number,
    maxThreshold: number,
    level: ChargeLevel | null,
  ): void {
    const el = this.slotElements.get(skillId);
    if (!el) return;

    if (!level) {
      el.chargeBar.style.display = 'none';
      el.wrapper.classList.remove('charging-tap', 'charging-lv1', 'charging-max');
      return;
    }

    el.chargeBar.style.display = 'block';
    const pct = Math.min(100, (chargeTime / maxThreshold) * 100);
    el.chargeFill.style.width = `${pct}%`;

    el.wrapper.classList.remove('charging-tap', 'charging-lv1', 'charging-max');
    el.wrapper.classList.add(`charging-${level}`);

    switch (level) {
      case 'tap':
        el.chargeFill.style.background = 'linear-gradient(90deg, #5B0E91, #B06EFF)';
        break;
      case 'lv1':
        el.chargeFill.style.background = 'linear-gradient(90deg, #806000, #FFD700)';
        break;
      case 'max':
        el.chargeFill.style.background = 'linear-gradient(90deg, #800000, #FF4444)';
        break;
    }
  }

  /** Combo penceresi actik combo yapilabilecek slotlari parlat */
  public setComboHighlight(skillIds: string[], active: boolean): void {
    for (const [id, el] of this.slotElements) {
      if (active && skillIds.includes(id)) {
        el.wrapper.classList.add('combo-ready');
      } else {
        el.wrapper.classList.remove('combo-ready');
      }
    }
  }

  public update(
    slots: readonly SkillState[],
    currentMp: number,
    getUpgradeLevel?: (skillId: string) => number,
  ): void {
    for (const slot of slots) {
      const el = this.slotElements.get(slot.def.id);
      if (!el) continue;

      // Upgrade badge
      const upgradeLevel = getUpgradeLevel ? getUpgradeLevel(slot.def.id) : 0;
      if (upgradeLevel > 0) {
        el.upgradeBadge.style.display = 'block';
        el.upgradeBadge.textContent = `+${upgradeLevel}`;
      } else {
        el.upgradeBadge.style.display = 'none';
      }

      if (slot.cooldownRemaining > 0) {
        el.cooldownOverlay.style.display = 'block';
        el.cooldownText.style.display = 'block';
        el.cooldownText.textContent = Math.ceil(slot.cooldownRemaining).toString();
        const pct = slot.cooldownRemaining / slot.def.cooldown;
        el.cooldownOverlay.style.height = `${pct * 100}%`;
      } else {
        el.cooldownOverlay.style.display = 'none';
        el.cooldownText.style.display = 'none';
      }

      if (currentMp < slot.def.mpCost && slot.cooldownRemaining <= 0) {
        el.wrapper.classList.add('no-mp');
      } else {
        el.wrapper.classList.remove('no-mp');
      }

      if (slot.isActive && slot.activeTimer > 0) {
        el.wrapper.classList.add('active');
      } else {
        el.wrapper.classList.remove('active');
      }
    }
  }

  public dispose(): void {
    this.container.remove();
  }
}
