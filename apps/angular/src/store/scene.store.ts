import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { SceneModStore } from '../features/mode/scene-mod.store';
import { BuildingStore } from '../features/building-pick/building.store';
import { MeasureStore } from '../features/measure/measure.store';
import { RouteStore } from '../features/route/route.store';
import { vec3 } from 'gl-matrix';
import { SceneMode } from '../features/mode/scene-mode';

export const SceneStore = signalStore(
  withProps(() => ({
    _mode: inject(SceneModStore),
    _building: inject(BuildingStore),
    _measure: inject(MeasureStore),
    _route: inject(RouteStore),
  })),
  withComputed(({ _mode, _measure, _route }) => ({
    activePolyline: computed((): vec3[] | null => {
      switch (_mode.mode()) {
        case 'measure': {
          const segment = _measure.segment();
          return segment ? [segment.a, segment.b] : null;
        }
        case 'route':
          return _route.path();
        default:
          return null;
      }
    }),
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
