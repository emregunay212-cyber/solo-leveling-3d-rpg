import { SKILLS } from '../config/GameConfig';
import type { SkillDef } from './SkillDef';

/**
 * Skill veri tanimlari — Solo Leveling temali.
 * GameConfig'ten degerler alinir.
 */
export const SKILL_LIST: readonly SkillDef[] = [
  SKILLS.phantomStrike,
  SKILLS.shadowShield,
  SKILLS.shadowBurst,
  SKILLS.sovereignAura,
] as const;

export const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(
  SKILL_LIST.map(s => [s.id, s])
);

/** Tus kodundan skill bul */
export function getSkillByKey(keyCode: string): SkillDef | undefined {
  return SKILL_LIST.find(s => s.key === keyCode);
}
