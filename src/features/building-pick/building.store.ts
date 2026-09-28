import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Building } from '../../city/generate-city.types';

export const BuildingStore = signalStore(
  withState<{ selected: Building | null }>({ selected: null }),
  withMethods((store) => ({
    pick: ({ building }: { building: Building | null }) => patchState(store, { selected: building }),
    clear: () => patchState(store, { selected: null }),
  })),
);
