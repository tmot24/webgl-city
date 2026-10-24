import { afterNextRender, computed, DestroyRef, ElementRef, inject, signal, Signal } from '@angular/core';
import { vec3 } from 'gl-matrix';
import { OrbitSettings } from '@webgl-city/core/camera/orbit.type';
import {
  createOrbitState,
  DEFAULT_ORBIT_SETTINGS,
  orbitEye,
  orbitViewMatrix,
  panOrbit,
  rotateOrbit,
  zoomOrbit,
} from '@webgl-city/core/camera/orbit';
import { bindOrbitControls } from '@webgl-city/core/camera/bind-orbit-controls';

interface InjectOrbitCamera {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  // Положение наблюдателя
  initialEye: vec3;
  // Куда смотрит камера
  center?: vec3;
  // Верх смотрящего
  up?: vec3;
  // Переопределение чувствительности пределов
  settings?: Partial<OrbitSettings>;
}

/**
 * Angular-адаптер орбитальной камеры: состояние - сигнал, производные - computed,
 * ввод - bindOrbitControls, переходы состояния - чистые функции из core.
 * */
export function injectOrbitCamera({ canvasRef, initialEye, center, up, settings }: InjectOrbitCamera) {
  const destroyRef = inject(DestroyRef);
  const resolvedSettings: OrbitSettings = { ...DEFAULT_ORBIT_SETTINGS, ...settings };

  const state = signal(createOrbitState({ eye: initialEye, center }));

  const eyePoint = computed(() => orbitEye({ state: state() }));
  const viewMatrix = computed(() => orbitViewMatrix({ state: state(), up }));
  const centerPoint = computed(() => state().center);
  const distance = computed(() => state().radius);

  // Один раз. Слушатели вешаем только после того, как view гарантированно инициализирован
  // и canvasRef() можно безопасно резолвить
  afterNextRender({
    write: () => {
      const unbind = bindOrbitControls({
        canvas: canvasRef().nativeElement,
        onRotate: ({ dx, dy }) => state.update((s) => rotateOrbit({ state: s, dx, dy, settings: resolvedSettings })),
        onPan: ({ dx, dy }) => state.update((s) => panOrbit({ state: s, dx, dy, settings: resolvedSettings })),
        onZoom: ({ deltaY }) => state.update((s) => zoomOrbit({ state: s, deltaY, settings: resolvedSettings })),
      });

      destroyRef.onDestroy(unbind);
    },
  });

  return {
    viewMatrix,
    eyePoint,
    center: centerPoint,
    distance,
  };
}
