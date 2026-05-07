export interface RandomSource {
  next(): number;
}

export class SeededRandom implements RandomSource {
  private seed: number;

  constructor(seed = 1) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

export const defaultRandom: RandomSource = {
  next: () => Math.random(),
};

export function pickOne<T>(items: readonly T[], random: RandomSource = defaultRandom): T {
  if (items.length === 0) {
    throw new Error('无法从空列表中选择元素');
  }
  return items[Math.floor(random.next() * items.length)]!;
}
