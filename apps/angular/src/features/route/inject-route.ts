import { ElementRef, inject, Signal } from '@angular/core';
import { mat4, vec3 } from 'gl-matrix';
import { GroundBounds } from '@webgl-city/core/ray/intersect-ground';
import { injectCanvasPointer } from '../../interaction/inject-canvas-pointer';
import { RoadGrid } from '@webgl-city/core/city/generate-city.types';
import { RouteStore } from './route.store';
import { SceneModStore } from '../mode/scene-mod.store';
import { createRoutePlanner } from '@webgl-city/core/route/create-route-planner';

interface InjectRoute {
  canvasRef: Signal<ElementRef<HTMLCanvasElement>>;
  viewProjection: () => mat4;
  eyePoint: Signal<vec3>;
  road: RoadGrid;
  groundBounds: GroundBounds;
}

/**
 * Режим маршрута: клик по земле => ближайший перекрёсток (узел графа).
 * Первый клик - точка A, второй - B и путь A*; следующий клик начинает новый маршрут.
 * */
export function injectRoute({ canvasRef, viewProjection, eyePoint, groundBounds, road }: InjectRoute) {
  const store = inject(RouteStore);
  const planner = createRoutePlanner({ road, groundBounds });

  injectCanvasPointer({
    canvasRef,
    viewProjection,
    eyePoint,
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
