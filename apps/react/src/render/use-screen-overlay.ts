import { ScreenPoint } from '@webgl-city/core/ray/world-to-screen';
import { RefObject, useEffect, useEffectEvent } from 'react';
import { compareStructural, reaction } from 'mobx';

export interface ScreenOverlayData extends ScreenPoint {
  text?: string;
}

interface UseScreenOverlay {
  // элемент метки: рендерится один раз, дальше им управляет хук
  ref: RefObject<HTMLElement | null>;
  // данные метки из сторов; null - метку скрыть
  read: () => ScreenOverlayData | null;
}

/**
 * Метка поверх сцены, привязанная к точке мира. React рендерит элемент один раз,
 * а позицию, текст и видимость пишет reaction - не чаще раза за кадр, без ре-рендеров.
 * Точку привязки получает CSS через --x/--y; центрирование - в стилях метки.
 * */
export function useScreenOverlay({ ref, read }: UseScreenOverlay) {
  const readData = useEffectEvent(read);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return reaction(
      // что отслеживать: всё observable, прочитанное внутри read
      () => readData(),
      // что делать с результатом: только запись в DOM
      (data) => {
        element.hidden = data === null;
        if (!data) return;

        element.style.setProperty('--anchor-x', `${data.x}px`);
        element.style.setProperty('--anchor-y', `${data.y}px`);
        // текст трогаем, только если он реально изменился
        if (data.text !== undefined && element.textContent !== data.text) {
          element.textContent = data.text;
        }
      },
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
