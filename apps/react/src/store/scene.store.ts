import { vec3 } from 'gl-matrix';
import { DEFAULT_LIGHT_DIRECTION } from '@webgl-city/core/city/city-default';
import { makeAutoObservable, observableRef } from 'mobx';
import { SceneModeStore } from '../features/mode/scene-mode.store';
import { BuildingStore } from '../features/building-pick/building.store';
import { MeasureStore } from '../features/measure/measure.store';
import { RouteStore } from '../features/route/route.store';
import { selectActivePolyline } from '@webgl-city/core/scene/active-polyline';
import { SceneMode } from '@webgl-city/core/scene/scene-mode';

/**
 * Корневой стор сцены: владеет сторами фич и связывает их между собой.
 * Создаётся один раз на экземпляр Scene - вместе с ним создаются и дочерние сторы.
 * */
export class SceneStore {
  readonly mode = new SceneModeStore();
  readonly building = new BuildingStore();
  readonly measure = new MeasureStore();
  readonly route = new RouteStore();

  // направление НА свет (нормализованное)
  lightDirectionNorm: vec3 = DEFAULT_LIGHT_DIRECTION;
  castShadows = true;

  constructor() {
    makeAutoObservable(
      this,
      {
        // дочерние сторы сами observable, а ссылки на них не меняются - отслеживать нечего
        mode: false,
        building: false,
        measure: false,
        route: false,
        lightDirectionNorm: observableRef,
      },
      { autoBind: true },
    );
  }

  // id подсвечиваемого здания: подсветка только в режиме выбора здания, -1 - без подсветки
  get selectedId(): number {
    return this.mode.isBuilding ? (this.building.selected?.id ?? -1) : -1;
  }

  // линия поверх сцены: отрезок измерения или маршрут - зависит от режима
  get activePolyline(): vec3[] | null {
    return selectActivePolyline({
      mode: this.mode.mode,
      segment: this.measure.segment,
      routePath: this.route.path,
    });
  }

  cancelActiveAction() {
    const cancelHandlers: Record<SceneMode, () => void> = {
      building: this.building.clear,
      measure: this.measure.cancel,
      route: this.route.reset,
    };
    cancelHandlers[this.mode.mode]();
  }
}
