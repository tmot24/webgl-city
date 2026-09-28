import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { SCENE_MODES, SceneMode } from './scene-mode';
import { computed, Signal } from '@angular/core';

type ModelFlags = Record<SceneMode, Signal<boolean>>;

export const SceneModStore = signalStore(
  {
    providedIn: 'root',
  },
  withState<{ mode: SceneMode }>({ mode: 'building' }),
  withProps(({ mode }) => ({
    // Флаг на каждый режим: modeStore.is.measure() - фичи включают свой ввод по нему
    is: Object.fromEntries(SCENE_MODES.map(({ id }) => [id, computed(() => mode() === id)])) as ModelFlags,
  })),
  withMethods((store) => ({
    setMode: ({ mode }: { mode: SceneMode }) => patchState(store, { mode }),
  })),
);
