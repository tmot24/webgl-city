import { RefObject, useLayoutEffect } from 'react';
import { CityScene } from '@webgl-city/core/city/build-city-scene';
import { SceneViewport } from './scene-viewport';
import { SceneStore } from '../store/scene.store';
import { CityFrame, createCityRenderer } from '@webgl-city/core/render/create-city-renderer';
import { CITY_COLORS } from '@webgl-city/core/city/city-default';
import { reaction } from 'mobx';

interface UseCityRender {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cityScene: CityScene;
  viewport: SceneViewport;
  store: SceneStore;
}

/**
 * React-адаптер рендера: кадр собирается из MobX-сторов внутри reaction.
 * Перерисовка - когда меняется любое observable, прочитанное в кадре; React при этом не рендерит.
 * */
export function useCityRender({ canvasRef, cityScene, viewport, store }: UseCityRender) {
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { instanceData, groundGeometry, roadGeometry } = cityScene;
    const renderer = createCityRenderer({
      canvas,
      instanceData,
      ground: { geometry: groundGeometry, color: CITY_COLORS.ground },
      road: { geometry: roadGeometry, color: CITY_COLORS.road },
    });

    // Кадр как данные: MobX отслеживает всё, что прочитано в первой функции
    const disposeReaction = reaction(
      (): CityFrame => ({
        size: viewport.size,
        camera: {
          viewProjection: viewport.viewProjection,
          eye: viewport.camera.eye,
          center: viewport.camera.center,
          distance: viewport.camera.distance,
        },
        light: {
          directionNorm: store.lightDirectionNorm,
          castShadows: store.castShadows,
        },
        selectedId: store.selectedId,
        polyline: store.activePolyline,
      }),
      (frame) => renderer.render(frame),
      {
        // первый кадр - сразу, синхронно
        fireImmediately: true,
        // дальше все изменения до ближайшего кадра браузера склеиваются в один запуск:
        // и сборка кадра, и отрисовка - не чаще раза за кадр
        scheduler: (run) => requestAnimationFrame(run),
      },
    );

    return () => {
      // после отписки запланированный rAF выйдет на проверке isDisposed внутри MobX
      disposeReaction();
      renderer.dispose();
    };
  }, [canvasRef, cityScene, viewport, store]);
}
