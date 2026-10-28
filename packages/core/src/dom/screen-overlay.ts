import { ScreenPoint } from '../ray/world-to-screen';

// Что показывать: точка на экране (CSS-пиксели canvas) и, если нужно, текст
export interface ScreenOverlayData extends ScreenPoint {
  text?: string;
}

// Сравнение по содержимому: новый объект с теми же x, y, text - не изменение
export function isSameOverlayData({ a, b }: { a: ScreenOverlayData | null; b: ScreenOverlayData | null }): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.text === b.text;
}

/**
 * Записывает состояние метки в её элемент: видимость, точку привязки (--anchor-x/--anchor-y), текст.
 * Центрирование относительно точки - в CSS метки.
 * */
export function applyScreenOverlay({ element, data }: { element: HTMLElement; data: ScreenOverlayData | null }) {
  element.hidden = data === null;
  if (!data) return;

  element.style.setProperty('--anchor-x', `${data.x}px`);
  element.style.setProperty('--anchor-y', `${data.y}px`);
  // текст трогаем, только если он реально изменился
  if (data.text !== undefined && element.textContent !== data.text) {
    element.textContent = data.text;
  }
}
