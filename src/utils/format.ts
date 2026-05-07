export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.round(value).toString();
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
