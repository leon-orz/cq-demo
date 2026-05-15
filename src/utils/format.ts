import type { Affix, Player } from '@/types';
import { AffixType, Rarity } from '@/types/enums';
import { AFFIX_LABELS, RARITY_LABELS, SLOT_LABELS } from './constants';
import type { SlotType } from '@/types/enums';

const STAT_LABELS: Partial<Record<keyof Player, string>> = {
  strength: '力量',
  agility: '敏捷',
  intelligence: '智力',
  hp: '生命',
  maxHp: '最大生命',
  atk: '攻击',
  atkSpd: '攻速',
  critRate: '暴击率',
  critDmg: '暴击伤害',
  armor: '护甲',
  dodge: '闪避',
  fireDamage: '火焰伤害',
  iceDamage: '冰霜伤害',
  lightningDamage: '雷霆伤害',
  fireRes: '火焰抗性',
  iceRes: '冰霜抗性',
  lightningRes: '雷霆抗性',
  goldFind: '金币获取',
  magicFind: '魔法发现',
  expFind: '经验获取',
  lifeLeech: '吸血',
};

const PERCENT_STATS = new Set<keyof Player>([
  'critRate',
  'critDmg',
  'dodge',
  'fireDamage',
  'iceDamage',
  'lightningDamage',
  'fireRes',
  'iceRes',
  'lightningRes',
  'goldFind',
  'magicFind',
  'expFind',
  'lifeLeech',
]);

const PERCENT_AFFIXES = new Set<AffixType>([
  AffixType.CRUEL,
  AffixType.EAGLE_EYE,
  AffixType.SWIFT,
  AffixType.FIRE,
  AffixType.ICE,
  AffixType.LIGHTNING,
  AffixType.NIMBLE,
  AffixType.FIRE_RES,
  AffixType.ICE_RES,
  AffixType.LIGHTNING_RES,
  AffixType.GREED,
  AffixType.FORTUNE,
  AffixType.EXPERIENCE,
  AffixType.LEECH,
  AffixType.MOVE_SPEED,
]);

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟${secs}秒`;
  return `${secs}秒`;
}

export function getStatLabel(stat: keyof Player): string {
  return STAT_LABELS[stat] ?? String(stat);
}

export function formatStatValue(stat: keyof Player, value: number): string {
  return PERCENT_STATS.has(stat) ? formatPercent(value) : formatNumber(value);
}

export function formatAffix(affix: Affix): string {
  const label = AFFIX_LABELS[affix.type];
  const value = PERCENT_AFFIXES.has(affix.type) ? formatPercent(affix.value) : formatNumber(affix.value);
  return `${label} +${value}`;
}

export function rarityLabel(rarity: Rarity): string {
  return RARITY_LABELS[rarity];
}

export function slotLabel(slot: SlotType): string {
  return SLOT_LABELS[slot];
}
