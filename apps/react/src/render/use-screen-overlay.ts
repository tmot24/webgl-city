import { RefObject, useEffect, useEffectEvent } from 'react';
import { compareStructural, reaction } from 'mobx';
import { applyScreenOverlay, ScreenOverlayData } from '@webgl-city/core/dom/screen-overlay';

interface UseScreenOverlay {
  // элемент метки: рендерится один раз, дальше им управляет хук
  ref: RefObject<HTMLElement | null>;
  // данные метки из сторов; null - метку скрыть
  read: () => ScreenOverlayData | null;
}

/**
 * Метка поверх сцены, привязанная к точке мира. React рендерит элемент один раз,
 * а позицию, текст и видимость пишет reaction - не чаще раза за кадр, без ре-рендеров.
 */
export function useScreenOverlay({ ref, read }: UseScreenOverlay) {
  const readData = useEffectEvent(read);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return reaction(
      // что отслеживать: всё observable, прочитанное внутри read
      () => readData(),
      // что делать с результатом: только запись в DOM
      (data) => applyScreenOverlay({ element, data }),
      {
        // первое состояние - сразу (метка могла появиться уже с данными)
        fireImmediately: true,
        // новый объект с теми же x, y, text - не изменение: DOM не трогаем
        equals: compareStructural,
        // все изменения за кадр => одна запись, в том же кадре, что и canvas
        scheduler: (run) => requestAnimationFrame(run),
      },
    );
  }, [ref]);
}
