import { applyScreenOverlay, isSameOverlayData, ScreenOverlayData } from '@webgl-city/core/dom/screen-overlay';
import { afterRenderEffect, computed, ElementRef, inject } from '@angular/core';

interface InjectScreenOverlay {
  // данные метки из сигналов; null - метку скрыть
  read: () => ScreenOverlayData | null;
}

/**
 * Метка поверх сцены, привязанная к точке мира. Элемент метки - host-элемент компонента;
 * позицию, текст и видимость пишет эффект напрямую в DOM, шаблон не участвует.
 * */
export function injectScreenOverlay({ read }: InjectScreenOverlay) {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // equal: новый объект с теми же x, y, text - эффект не будится
  const data = computed(read, { equal: (a, b) => isSameOverlayData({ a, b }) });

  // фаза write цикла отрисовки Angular - не чаще раза за кадр
  afterRenderEffect({
    write: () => applyScreenOverlay({ element, data: data() }),
  });
}
