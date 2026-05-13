import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import SkillPanel from '@/components/skilltree/SkillPanel.vue';
import { usePlayerStore } from '@/stores/player';

describe('SkillPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应展示四条天赋分支和可用点数', () => {
    const player = usePlayerStore();
    player.level = 3;

    const wrapper = mount(SkillPanel);

    expect(wrapper.text()).toContain('天赋');
    expect(wrapper.text()).toContain('可用 2 / 总计 2');
    expect(wrapper.text()).toContain('暴击');
    expect(wrapper.text()).toContain('攻速');
    expect(wrapper.text()).toContain('防御');
    expect(wrapper.text()).toContain('寻宝');
  });

  it('点击激活后应消耗点数并更新节点状态', async () => {
    const player = usePlayerStore();
    player.level = 2;
    const wrapper = mount(SkillPanel);

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('暴击'))!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '激活')!
      .trigger('click');

    expect(player.spentSkillPoints).toBe(1);
    expect(wrapper.text()).toContain('可用 0 / 总计 1');
    expect(wrapper.text()).toContain('已生效');
  });

  it('应默认折叠非寻宝分支并显示已激活计数', async () => {
    const player = usePlayerStore();
    player.level = 2;
    player.activateSkillNode('crit_chance_1');
    const wrapper = mount(SkillPanel);

    expect(wrapper.text()).toContain('1/3');
    expect(wrapper.text()).toContain('金币嗅觉');
    expect(wrapper.text()).toContain('精准弱点');

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('暴击'))!
      .trigger('click');

    expect(wrapper.text()).not.toContain('精准弱点');
  });

  it('激活寻宝节点后应更新收益属性', async () => {
    const player = usePlayerStore();
    player.level = 2;
    const wrapper = mount(SkillPanel);

    const treasureNode = wrapper.findAll('article').find((node) => node.text().includes('金币嗅觉'))!;
    await treasureNode.find('button').trigger('click');

    expect(player.totalStats.goldFind).toBe(8);
  });

  it('点数不足时应禁用节点激活按钮', () => {
    const wrapper = mount(SkillPanel);
    const activateButtons = wrapper.findAll('button').filter((button) => button.text() === '点数不足');

    expect(activateButtons.length).toBeGreaterThan(0);
    expect(activateButtons[0]?.attributes('disabled')).toBeDefined();
  });

  it('点击重置后应清空已激活节点', async () => {
    const player = usePlayerStore();
    player.level = 2;
    player.activateSkillNode('crit_chance_1');
    const wrapper = mount(SkillPanel);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重置')!
      .trigger('click');

    expect(player.spentSkillPoints).toBe(0);
    expect(wrapper.text()).toContain('可用 1 / 总计 1');
  });
});
