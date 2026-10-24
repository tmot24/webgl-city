import { isEditableTarget } from '../dom/is-editable-target';

interface MouseDelta {
  dx: number;
  dy: number;
}

interface BindOrbitControls {
  canvas: HTMLCanvasElement;
  onRotate: (delta: MouseDelta) => void;
  onPan: (delta: MouseDelta) => void;
  onZoom: (params: { deltaY: number }) => void;
}

/**
 * Переводит ввод мыши/клавиатуры в намерения камеры:
 * ПКМ-drag => поворот, пробел + ЛКМ => pan (как в Figma), колесо => зум.
 * Состояние камеры не трогает - только сообщает дельты. Возвращает функцию отписки.
 * */
export function bindOrbitControls({ canvas, onRotate, onPan, onZoom }: BindOrbitControls) {
  // Пробел зажат? Тогда ЛКМ-drag - это пан
  let isSpaceHeld = false;

  const mouseMoveHandler = (event: MouseEvent) => {
    const delta = {
      dx: event.movementX,
      dy: event.movementY,
    };

    // Пан: пробел + ЛКМ (бит 1 в маске buttons)
    if (isSpaceHeld && (event.buttons & 1) === 1) {
      canvas.style.cursor = 'grabbing';
      onPan(delta);
      return;
    }

    // Вращаем только при зажатой ПКМ (бит 2 в маске buttons)
    if ((event.buttons & 2) === 2) {
      onRotate(delta);
      return;
    }
  };

  const contextMenuHandler = (event: MouseEvent) => event.preventDefault();

  const wheelHandler = (event: WheelEvent) => {
    event.preventDefault();
    onZoom({ deltaY: event.deltaY });
  };

  const keyDownHandler = (event: KeyboardEvent) => {
    // Не перехватываем пробел, если печатают в поле ввода
    if (event.code !== 'Space' || isEditableTarget(event.target)) return;
    event.preventDefault(); // пробел иначе скролит страницу
    // Авто-повтор keydown при удержании: состояние уже выставлено.
    // Иначе повтор ставил бы курсор 'grab' поверх 'grabbing' от пана - курсор мигал бы
    if (event.repeat) return;
    isSpaceHeld = true;
    canvas.style.cursor = 'grab';
  };

  const releaseSpace = () => {
    isSpaceHeld = false;
    canvas.style.cursor = '';
  };

  const keyUpHandler = (event: KeyboardEvent) => {
    if (event.code === 'Space') releaseSpace();
  };

  // Ушли с окна - keyup пробела может не прийти, иначе isSpaceHeld залипнет
  const blurHandler = () => releaseSpace();

  canvas.addEventListener('mousemove', mouseMoveHandler);
  canvas.addEventListener('contextmenu', contextMenuHandler);
  // passive: false - иначе preventDefault на wheel игнорируется и страница скролится
  canvas.addEventListener('wheel', wheelHandler, { passive: false });
  // Пробел ловим на window: клавиатурный фокус может быть не на canvas
  window.addEventListener('keydown', keyDownHandler);
  window.addEventListener('keyup', keyUpHandler);
  window.addEventListener('blur', blurHandler);

  return () => {
    canvas.removeEventListener('mousemove', mouseMoveHandler);
    canvas.removeEventListener('contextmenu', contextMenuHandler);
    canvas.removeEventListener('wheel', wheelHandler);
    window.removeEventListener('keydown', keyDownHandler);
    window.removeEventListener('keyup', keyUpHandler);
    window.removeEventListener('blur', blurHandler);
  };
}
