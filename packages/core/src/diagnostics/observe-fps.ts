import { runAnimationFrame } from '../gl/run-animation-frame';

interface ObserveFps {
  // окно усреднения, мс: FPS сообщается раз в окно, а не каждый кадр
  sampleMs?: number;
  // кадров в секунду за последнее окно
  onSample: (params: { fps: number }) => void;
}

/**
 * Считает частоту кадров браузера и сообщает её раз в окно усреднения.
 * Запускается сразу при вызове; возвращает функцию остановки.
 */
export function observeFps({ sampleMs = 500, onSample }: ObserveFps): () => void {
  let frames = 0;
  let elapsed = 0;

  return runAnimationFrame({
    onFrame: ({ delta }) => {
      frames++;
      elapsed += delta;
      if (elapsed < sampleMs) return;

      onSample({ fps: Math.round((frames * 1000) / elapsed) });
      frames = 0;
      elapsed = 0;
    },
  });
}
