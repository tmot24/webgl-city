import { mat4, vec3 } from 'gl-matrix';
import { Ray, screenPointToRay } from '../ray/screen-point-to-ray';
import { CLICK_MOVE_THRESHOLD } from '../constants';

export interface PointCamera {
  viewProjection: mat4;
  // Позиция камеры, начало луча
  eye: vec3;
}

export interface BindCanvasPointer {
  canvas: HTMLCanvasElement;
  // камера на момент события (читается при каждом событии, а не один раз)
  getCamera: () => PointCamera;
  // выключено => события игнорируются, луч даже не строится
  isEnabled?: () => boolean;
  // валидный клик ЛКМ (не перетаскивание) => луч; пересечение - дело фичи
  onClick: (ray: Ray) => void;
  // движение указателя => луч (для отслеживания курсора)
  onMove?: (ray: Ray) => void;
}

/**
 * Указатель над canvas: переводит клики и движение в лучи из камеры.
 * Клик засчитывается, только если между down и up мышь сдвинулась не дальше порога
 * (иначе это было перетаскивание - пан/поворот камеры). Возвращает функцию отписки.
 * */
export function bindCanvasPointer({ canvas, getCamera, isEnabled = () => true, onClick, onMove }: BindCanvasPointer) {
  const controller = new AbortController();
  const { signal } = controller;

  let downX = 0;
  let downY = 0;

  const rayFrom = (event: PointerEvent): Ray | null => {
    const { viewProjection, eye } = getCamera();
    return screenPointToRay({ event, rect: canvas.getBoundingClientRect(), viewProjection, eyePoint: eye });
  };

  const downHandler = (event: PointerEvent) => {
    if (event.button !== 0) return; // только ЛКМ
    downX = event.clientX;
    downY = event.clientY;
  };

  const upHandler = (event: PointerEvent) => {
    if (event.button !== 0 || !isEnabled()) return;
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > CLICK_MOVE_THRESHOLD) return;

    const ray = rayFrom(event);
    if (ray) {
      onClick(ray);
    }
  };

  const moveHandler = (event: PointerEvent) => {
    if (!onMove || !isEnabled()) return;
    const ray = rayFrom(event);
    if (ray) {
      onMove(ray);
    }
  };

  canvas.addEventListener('pointerdown', downHandler, { signal });
  canvas.addEventListener('pointerup', upHandler, { signal });
  if (onMove) canvas.addEventListener('pointermove', moveHandler, { signal });

  return () => controller.abort();
}
