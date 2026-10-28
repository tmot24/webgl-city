import { CityScene } from '@webgl-city/core/city/build-city-scene';
import { SceneViewport } from '../../render/scene-viewport';
import { SceneStore } from '../../store/scene.store';
import { useMemo } from 'react';
import { createRoutePlanner } from '@webgl-city/core/route/create-route-planner';
import { useCanvasPointer } from '../../interaction/use-canvas-pointer';

interface UseRoute {
  cityScene: CityScene;
  viewport: SceneViewport;
  store: SceneStore;
}

/**
 * Режим маршрута: клик по земле => ближайший перекрёсток.
 * Первый клик - точка A, второй точка B и путь A*; следующий клик начинает новый маршрут.
 * */
export function useRoute({ cityScene, viewport, store }: UseRoute) {
  // Граф дорог строится один раз на город: производные данные, а не состояние => useMemo
  const planner = useMemo(() => {
    return createRoutePlanner({
      road: cityScene.city.road,
      groundBounds: cityScene.groundBounds,
    });
  }, [cityScene]);

  useCanvasPointer({
    viewport,
    isEnabled: () => store.mode.isRoute,
    onClick: (ray) => {
      const node = planner.nodeAt({ ray });
      if (node === null) return; // клик мимо земли

      const { route } = store;
      const start = route.start;
      // Нет точки A или маршрут уже построен => этот клик начинает новый
      if (start === null || !route.awaitingFinish) {
        route.begin({ node });
        return;
      }

      // A есть, B нет => это B: строим маршрут
      route.complete({
        node,
        path: planner.findRoute({
          start,
          finish: node,
        }),
      });
    },
  });
}
