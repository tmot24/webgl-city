import { ElementRef, Signal, WritableSignal } from '@angular/core';
import { vec3 } from 'gl-matrix';

interface PanHandler {
  event: MouseEvent;
  azimuth: WritableSignal<number>;
  radius: WritableSignal<number>;
  panSpeed: number;
  centerPoint: WritableSignal<vec3>;
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
}

// Пан: двигаем центр орбиты по земле ("захват" карты)
export const panHandler = ({ event, azimuth, radius, panSpeed, centerPoint, canvasRef }: PanHandler) => {
  const a = azimuth();
  // Оси экрана, спроецированные на землю (из азимута):
  // rightGround - "вправо по экрану"
  const rightGround = { x: Math.cos(a), z: -Math.sin(a) };
  // forwardGround - "в глубину экрана"
  const forwardGround = { x: -Math.sin(a), z: -Math.cos(a) };
  // Масштаб пана растёт с радиусом => на любом зуме тащишь землю с одинаковым "сцеплением"
  const scale = radius() * panSpeed;

  // "Захват": тянешь мышь вправо => землю вправо => центр влево (обратный знак), аналогично вниз
  const dx = (-rightGround.x * event.movementX + forwardGround.x * event.movementY) * scale;
  const dz = (-rightGround.z * event.movementX + forwardGround.z * event.movementY) * scale;

  canvasRef().nativeElement.style.cursor = 'grabbing';
  centerPoint.update((c) => vec3.fromValues(c[0] + dx, c[1], c[2] + dz));
};
