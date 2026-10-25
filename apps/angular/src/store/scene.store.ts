import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { SceneModStore } from '../features/mode/scene-mod.store';
import { BuildingStore } from '../features/building-pick/building.store';
import { MeasureStore } from '../features/measure/measure.store';
import { RouteStore } from '../features/route/route.store';
import { selectActivePolyline } from '@webgl-city/core/scene/active-polyline';
import { SceneMode } from '@webgl-city/core/scene/scene-mode';

export const SceneStore = signalStore(
  withProps(() => ({
    _mode: inject(SceneModStore),
    _building: inject(BuildingStore),
    _measure: inject(MeasureStore),
    _route: inject(RouteStore),
  })),
  withComputed(({ _mode, _measure, _route }) => ({
    activePolyline: computed(() =>
      selectActivePolyline({ mode: _mode.mode(), segment: _measure.segment(), routePath: _route.path() }),
    ),
  })),
  withMethods(({ _mode, _building, _measure, _route }) => {
    const cancelHandlers: Record<SceneMode, () => void> = {
      building: () => _building.clear(),
      measure: () => _measure.cancel(),
      route: () => _route.reset(),
    };

    return {
      // Esc: сбросить текущее действие активного режима
      cancelActiveAction: () => cancelHandlers[_mode.mode()](),
    };
  }),
);
