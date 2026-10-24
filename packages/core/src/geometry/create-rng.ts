// Random Number Generator - детерминированный генератор псевдослучайных чисел (mulberry32).
// Один seed => один и тот же город: удобно для отладки, тестов и воспроизводимых сцен, поэтому не Math.random
export interface Rng {
  // следующее число в [0, 1) - математическая запись от включительно, до не включая
  next: () => number;
  // число в [min, max)
  range: (params: { min: number; max: number }) => number;
  // целое в [min, max] включено
  int: (params: { min: number; max: number }) => number;
  // true с вероятностью probability от [0, 1]
  chance: (probability: number) => boolean;
}

export function createRng({ seed }: { seed: number }): Rng {
  // Числа в js - это 64-битные float
  // >>> - это беззнаковый сдвиг вправо на n bit
  let state = seed >>> 0; // 32-битное состояние

  // число [0, 1)
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // 4294967296 - это 2^32
  };

  const range: Rng['range'] = ({ min, max }) => min + (max - min) * next();
  const int: Rng['int'] = ({ min, max }) => Math.floor(range({ min, max: max + 1 }));
  const chance: Rng['chance'] = (probability) => next() < probability;

  return { next, range, int, chance };
}
