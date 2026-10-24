import {
  afterNextRender,
  afterRenderEffect,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  Signal,
} from '@angular/core';
import { InstanceData } from '@webgl-city/core/city/build-instance-data';
import { vec3 } from 'gl-matrix';
import { injectCanvasSize } from './inject-canvas-size';
import { injectOrbitCamera } from '../camera/inject-orbit-camera';
import { createViewProjectionMatrix } from '@webgl-city/core/math/create-view-projection-matrix';
import { Building } from '@webgl-city/core/city/generate-city.types';
import { CityFrame, CityRenderer, CitySurface, createCityRenderer } from '@webgl-city/core/render/create-city-renderer';
import { CITY_CAMERA } from '@webgl-city/core/city/city-default';

interface InjectCityRender {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  instanceData: InstanceData;
  ground: CitySurface;
  road: CitySurface;
  // направление НА свет (нормализованное)
  lightDirectionNorm: Signal<vec3>;
  selectedBuilding: Signal<Building | null>;
  activePolyline: Signal<vec3[] | null>;
  // подсветка выбранного здания
  isHighlightBuild: Signal<boolean>;
}

/**
 * Angular-адаптер рендера: собирает CityFrame из сигналов и отдаёт его рендеру ядра.
 * Перерисовка - когда меняется любой сигнал, из которого собран кадр.
 * */
export function injectCityRender({
  canvasRef,
  instanceData,
  ground,
  road,
  // солнце сверху-сбоку по умолчанию (направление НА свет), нормализуем
  lightDirectionNorm,
  selectedBuilding,
  activePolyline,
  isHighlightBuild,
}: InjectCityRender) {
  const size = injectCanvasSize({ canvasRef });
  const castShadows = signal(true);
  const destroyRef = inject(DestroyRef);

  const { viewMatrix, center, distance, eyePoint } = injectOrbitCamera({
    canvasRef,
    initialEye: CITY_CAMERA.initialEye,
  });

  // Аспект - из размера буфера: сигнал, а не canvas.width, чтобы пересчёт был реактивным
  const viewProjection = computed(() => {
    const { width, height } = size();
    return createViewProjectionMatrix({
      aspect: width / height,
      viewMatrix: viewMatrix(),
      near: CITY_CAMERA.near,
      far: CITY_CAMERA.far,
    });
  });

  const frame = computed((): CityFrame => ({
    size: size(),
    camera: {
      viewProjection: viewProjection(),
      eye: eyePoint(),
      center: center(),
      distance: distance(),
    },
    light: {
      directionNorm: lightDirectionNorm(),
      castShadows: castShadows(),
    },
    selectedId: isHighlightBuild() ? (selectedBuilding()?.id ?? -1) : -1,
    polyline: activePolyline(),
  }));

  let renderer: CityRenderer | null = null;

  // ОДИН РАЗ: GL-ресурсы и первый кадр сразу
  afterNextRender({
    write: () => {
      renderer = createCityRenderer({ canvas: canvasRef().nativeElement, instanceData, ground, road });
      destroyRef.onDestroy(() => renderer?.dispose());
      renderer.render(frame());
    },
  });

  // Реактивно: перерисовка при любом изменении кадра
  afterRenderEffect({
    write: () => {
      // Сначала читаем кадр (подписка), потом проверяем рендерер:
      // при раннем выходе ДО чтения эффект остался бы без зависимостей и больше не сработал
      const current = frame();
      renderer?.render(current);
    },
  });

  return { lightDirection: lightDirectionNorm, castShadows, viewProjection, eyePoint, size };
}
