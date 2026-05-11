import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePlayerStore } from '@/stores/player';

describe('角色天赋状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应由等级派生天赋点', () => {
    const player = usePlayerStore();
    player.level = 4;

    expect(player.skillPoints).toBe(3);
    expect(player.spentSkillPoints).toBe(0);
    expect(player.availableSkillPoints).toBe(3);
  });

  it('应能激活天赋节点并影响总属性', () => {
    const player = usePlayerStore();
    player.level = 2;

    const ok = player.activateSkillNode('crit_chance_1');

    expect(ok).toBe(true);
    expect(player.spentSkillPoints).toBe(1);
    expect(player.availableSkillPoints).toBe(0);
    expect(player.totalStats.critChance).toBe(8);
  });

  it('点数不足或重复激活时应失败', () => {
    const player = usePlayerStore();

    expect(player.activateSkillNode('crit_chance_1')).toBe(false);

    player.level = 2;
    expect(player.activateSkillNode('crit_chance_1')).toBe(true);
    expect(player.activateSkillNode('crit_chance_1')).toBe(false);
    expect(player.activateSkillNode('crit_damage_1')).toBe(false);
  });

  it('应能重置天赋节点', () => {
    const player = usePlayerStore();
    player.level = 3;
    player.activateSkillNode('crit_chance_1');
    player.activateSkillNode('tank_hp_1');

    player.resetSkillNodes();

    expect(player.spentSkillPoints).toBe(0);
    expect(player.availableSkillPoints).toBe(2);
    expect(player.skillNodes.every((node) => !node.active)).toBe(true);
  });

  it('应能归一化旧存档中的天赋节点', () => {
    const player = usePlayerStore();
    player.$patch({
      skillNodes: [
        {
          id: 'crit_chance_1',
          name: '旧节点',
          branch: 'crit',
          description: '旧描述',
          active: true,
          stat: 'critChance',
          value: 1,
        },
      ],
    });

    player.normalizeSkillNodes();

    expect(player.skillNodes.length).toBeGreaterThan(1);
    expect(player.skillNodes.find((node) => node.id === 'crit_chance_1')?.active).toBe(true);
    expect(player.skillNodes.find((node) => node.id === 'crit_chance_1')?.value).toBe(3);
  });
});
