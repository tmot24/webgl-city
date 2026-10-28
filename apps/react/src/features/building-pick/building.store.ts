import { Building } from '@webgl-city/core/city/generate-city.types';
import { makeAutoObservable, observableRef } from 'mobx';

/**
 * Выбранное здание (null - ничего не выбрано).
 * */
export class BuildingStore {
  // Здание из данных города - неизменяемое: храним ссылку как есть, без глубокой обёртки
  selected: Building | null = null;

  constructor() {
    makeAutoObservable(this, { selected: observableRef }, { autoBind: true });
  }

  pick({ building }: { building: Building | null }) {
    this.selected = building;
  }

  clear() {
    this.selected = null;
  }
}
