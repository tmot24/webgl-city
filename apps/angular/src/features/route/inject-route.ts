import { inject } from '@angular/core';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { RouteStore } from './route.store';
import { SceneModStore } from '../mode/scene-mod.store';
import { createRoutePlanner } from '@webgl-city/core/route/create-route-planner';
import { CITY_SCENE } from '../../app/scene/city-scene.token';

/**
 * Режим маршрута: клик по земле => ближайший перекрёсток (узел графа).
 * Первый клик - точка A, второй - B и путь A*; следующий клик начинает новый маршрут.
 * */
export function injectRoute() {
  const store = inject(RouteStore);
  const { city, groundBounds } = inject(CITY_SCENE);
  const planner = createRoutePlanner({ road: city.road, groundBounds });

  injectCanvasPointer({
    enabled: inject(SceneModStore).is.route,
    onClick: (ray) => {
      const node = planner.nodeAt({ ray });
      if (node === null) return; // клик мимо земли

      const start = store.start();
      // Нет точки A или маршрут уже построен => этот клик начинает новый
      if (start === null || !store.awaitingFinish()) {
        store.begin({ node });
        return;
      }

      // A есть, B нет => это B: стром маршрут A* между ними
      store.complete({ node, path: planner.findRoute({ start, finish: node }) });
    },
  });
}
