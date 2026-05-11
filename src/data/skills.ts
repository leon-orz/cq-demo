import type { SkillBranch, SkillNode } from '@/types/player';

export const skillBranchLabels: Record<SkillBranch, string> = {
  crit: '暴击',
  speed: '攻速',
  tank: '防御',
  treasure: '寻宝',
};

export const skillBranchDescriptions: Record<SkillBranch, string> = {
  crit: '提高暴击率和暴击伤害，放大爆发输出。',
  speed: '提高攻击速度和敏捷，缩短击杀时间。',
  tank: '提高生命、防御和闪避，增强推层容错。',
  treasure: '提高金币获取和魔法发现，作为后续收益构筑入口。',
};

export const defaultSkillNodes: SkillNode[] = [
  {
    id: 'crit_chance_1',
    name: '精准弱点',
    branch: 'crit',
    description: '暴击率 +3%。',
    active: false,
    stat: 'critChance',
    value: 3,
  },
  {
    id: 'crit_damage_1',
    name: '致命打击',
    branch: 'crit',
    description: '暴击伤害 +18%。',
    active: false,
    stat: 'critDamage',
    value: 18,
  },
  {
    id: 'crit_dex_1',
    name: '猎手直觉',
    branch: 'crit',
    description: '敏捷 +8。',
    active: false,
    stat: 'dex',
    value: 8,
  },
  {
    id: 'speed_attack_1',
    name: '疾风连击',
    branch: 'speed',
    description: '攻击速度 +0.12。',
    active: false,
    stat: 'attackSpeed',
    value: 0.12,
  },
  {
    id: 'speed_dodge_1',
    name: '轻步闪避',
    branch: 'speed',
    description: '闪避 +4%。',
    active: false,
    stat: 'dodgeChance',
    value: 4,
  },
  {
    id: 'speed_attack_2',
    name: '快速压制',
    branch: 'speed',
    description: '攻击 +10。',
    active: false,
    stat: 'attack',
    value: 10,
  },
  {
    id: 'tank_hp_1',
    name: '厚重体魄',
    branch: 'tank',
    description: '生命 +80。',
    active: false,
    stat: 'hp',
    value: 80,
  },
  {
    id: 'tank_armor_1',
    name: '钢铁护壁',
    branch: 'tank',
    description: '护甲 +18。',
    active: false,
    stat: 'armor',
    value: 18,
  },
  {
    id: 'tank_dodge_1',
    name: '稳固步伐',
    branch: 'tank',
    description: '闪避 +3%。',
    active: false,
    stat: 'dodgeChance',
    value: 3,
  },
  {
    id: 'treasure_gold_1',
    name: '金币嗅觉',
    branch: 'treasure',
    description: '金币获取 +8。',
    active: false,
    stat: 'goldFind',
    value: 8,
  },
  {
    id: 'treasure_magic_1',
    name: '魔法罗盘',
    branch: 'treasure',
    description: '魔法发现 +8。',
    active: false,
    stat: 'magicFind',
    value: 8,
  },
  {
    id: 'treasure_magic_2',
    name: '秘藏感知',
    branch: 'treasure',
    description: '魔法发现 +12。',
    active: false,
    stat: 'magicFind',
    value: 12,
  },
];

export function createDefaultSkillNodes(): SkillNode[] {
  return defaultSkillNodes.map((node) => ({ ...node, active: false }));
}

export function mergeSkillNodes(savedNodes: SkillNode[] = []): SkillNode[] {
  const savedActiveById = new Map(savedNodes.map((node) => [node.id, node.active]));
  return defaultSkillNodes.map((node) => ({
    ...node,
    active: savedActiveById.get(node.id) ?? false,
  }));
}
