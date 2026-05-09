import { describe, expect, it } from 'vitest';
import { formatDuration } from '@/utils/format';

describe('展示格式化', () => {
  it('应格式化离线时长', () => {
    expect(formatDuration(-10)).toBe('0 秒');
    expect(formatDuration(25)).toBe('25 秒');
    expect(formatDuration(125)).toBe('2 分钟 5 秒');
    expect(formatDuration(3660)).toBe('1 小时 1 分钟');
  });
});
