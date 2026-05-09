export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toString();
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;

  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  if (minutes > 0) return `${minutes} 分钟 ${restSeconds} 秒`;
  return `${restSeconds} 秒`;
}

export function rarityLabel(rarity: string): string {
  const labels: Record<string, string> = {
    normal: '普通',
    magic: '魔法',
    rare: '稀有',
    legendary: '传说',
    ancient: '远古',
  };
  return labels[rarity] ?? rarity;
}

export function rarityClass(rarity: string): string {
  const classes: Record<string, string> = {
    normal: 'border-slate-500 text-slate-200',
    magic: 'border-sky-500 text-sky-300',
    rare: 'border-amber-400 text-amber-300',
    legendary: 'border-orange-500 text-orange-300',
    ancient: 'border-fuchsia-500 text-fuchsia-300',
  };
  return classes[rarity] ?? classes.normal!;
}
