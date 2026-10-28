import { vec3 } from 'gl-matrix';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { RouteInfo, toRouteInfo } from '@webgl-city/core/route/route-info';

interface RouteState {
  // id узлов графа (перекрёстков)
  start: number | null;
  _finish: number | null;
  // найденный путь как точки в мире (null - нет маршрута)
  path: vec3[] | null;
}

const initialState: RouteState = {
  start: null,
  _finish: null,
  path: null,
};

export const RouteStore = signalStore(
  withState(initialState),
  withComputed(({ start, _finish, path }) => ({
    awaitingFinish: computed(() => start() !== null && _finish() === null),
    info: computed((): RouteInfo | null => toRouteInfo({ path: path() })),
  })),
  withMethods((store) => ({
    // Новый маршрут: точка A, всё остальное сброшено
    begin({ node }: { node: number }) {
      patchState(store, {
        start: node,
        _finish: null,
        path: null,
      });
    },
    // Точка B + путь, посчитанный снаружи (А* - побочный эффект, стор о графе не знает)
    complete({ node, path }: { node: number; path: vec3[] | null }) {
      patchState(store, {
        _finish: node,
        path,
      });
    },
    reset() {
      patchState(store, initialState);
    },
  })),
);
