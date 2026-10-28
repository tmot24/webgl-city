import { vec3 } from 'gl-matrix';
import { makeAutoObservable, observableRef } from 'mobx';
import { RouteInfo, toRouteInfo } from '@webgl-city/core/route/route-info';

/**
 * Маршрут между двумя перекрёстками: точка A, точка B и путь A*.
 * Граф и поиск пути - снаружи (планировщик из core), стор хранит только результат.
 * */
export class RouteStore {
  // id узла графа (перекрёстка)
  start: number | null = null;
  // найденный путь как точки в мире (null - нет маршрута)
  path: vec3[] | null = null;

  // Конечная точка нужна только для awaitingFinish - снаружи стора не видна
  private finish: number | null = null;

  constructor() {
    makeAutoObservable(this, { path: observableRef }, { autoBind: true });
  }

  // Точка A выбрана, B ещё нет
  get awaitingFinish(): boolean {
    return this.start !== null && this.finish === null;
  }

  // Сводка для панели: длина и число перекрёстков
  get info(): RouteInfo | null {
    return toRouteInfo({ path: this.path });
  }

  // Новый маршрут: точка A, всё остальное сброшено
  begin({ node }: { node: number }) {
    this.start = node;
    this.finish = null;
    this.path = null;
  }

  // Точка B + путь, посчитанный снаружи
  complete({ node, path }: { node: number; path: vec3[] | null }) {
    this.finish = node;
    this.path = path;
  }

  reset() {
    this.start = null;
    this.finish = null;
    this.path = null;
  }
}
