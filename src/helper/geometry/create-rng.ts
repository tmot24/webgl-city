// Детерминированный генератор псевдослучайных чисел (mulberry32).
// Один seed => один и тот же город: удобно для отладки, тестов и воспроизводимых сцен.
export interface Rng {
  // TODO: спросить как расшифровывается rng?
  // TODO: спросить почему после 1 скобка круглая, а не квадратная как перед 0
  // следующее число в [0, 1)
  next: () => number;
  // число в [min, max)
  range: (params: { min: number; max: number }) => number;
  // целое в [min, max] включено
  int: (params: { min: number; max: number }) => number;
  // TODO: спросить почему после 0 две точки
  // true с вероятностью probability (0..1)
  chance: (probability: number) => boolean;
}

// TODO: уточнить, почему нельзя было сделать проще через Math.random? Я не привык к побитовым операциям
export function createRng({ seed }: { seed: number }): Rng {
  // TODO: уточни что делает >>>
  let state = seed >>> 0; // 32-битное состояние

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const range: Rng['range'] = ({ min, max }) => min + (max - min) * next();
  const int: Rng['int'] = ({ min, max }) => Math.floor(range({ min, max: max + 1 }));
  const chance: Rng['chance'] = (probability) => next() < probability;

  return { next, range, int, chance };
}
