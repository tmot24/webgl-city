import { WritableSignal } from '@angular/core';

interface RotateHandler {
  event: MouseEvent;
  azimuth: WritableSignal<number>;
  polar: WritableSignal<number>;
  rotateSpeed: number;
  minPolar: number;
  maxPolar: number;
}

// Вращение орбиты вокруг центра (азимут + полярный угол)
export const rotateHandler = ({ event, azimuth, polar, rotateSpeed, minPolar, maxPolar }: RotateHandler) => {
  // movementX/Y - это СМЕЩЕНИЕ мыши с прошлого события (дельта), а не позиция.
  // Именно дельта позволяет крутить бесконечно: тянешь дальше - угол растёт без предела
  const deltaAzimuth = event.movementX * rotateSpeed;
  const deltaPolar = event.movementY * rotateSpeed;

  // Азимут просто накапливаем, предел не нужен, 360 и дальше по кругу.
  // Знак минус: тянешь мышь вправо => сцена поворачивается влево (привычно для orbit)
  azimuth.update((a) => a - deltaAzimuth);

  // Полярный угол накапливаем, но зажимаем в [minPolar, maxPolar],
  // чтобы камера не перелетала через полюс и не перевернулась
  polar.update((p) => Math.min(maxPolar, Math.max(minPolar, p - deltaPolar)));
};
