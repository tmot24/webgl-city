import { DestroyRef } from '@angular/core';

interface RunAnimationFrame {
  destroyRef: DestroyRef;
  onFrame: (params: { time: number; delta: number }) => void;
}

// Крутит requestAnimationFrame и сам останавливается при уничтожении компонента.
// Вызвать в injection context (внутри afterNextRender)
export function runAnimationFrame({ destroyRef, onFrame }: RunAnimationFrame) {
  let animationId = 0;
  let startTime: number | null = null;
  let lastTime = 0;

  const tick = (now: number) => {
    if (startTime === null) {
      startTime = now;
      lastTime = now;
    }
    const time = now - startTime; // мс с начала
    const delta = now - lastTime; // мс с прошлого кадра
    lastTime = now;

    onFrame({ time, delta });
    animationId = requestAnimationFrame(tick);
  };

  animationId = requestAnimationFrame(tick);
  destroyRef.onDestroy(() => cancelAnimationFrame(animationId));
}
