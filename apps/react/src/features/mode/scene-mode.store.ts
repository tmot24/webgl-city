import { SceneMode } from '@webgl-city/core/scene/scene-mode';
import { makeAutoObservable } from 'mobx';

export class SceneModeStore {
  mode: SceneMode = 'building';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setMode({ mode }: { mode: SceneMode }) {
    this.mode = mode;
  }

  // Флаг на каждый режим: фичи включают свой ввод по нему;
  // boolean - примитив: computed оповещает, только когда флаг реально сменился
  get isBuilding(): boolean {
    return this.mode === 'building';
  }
  get isMeasure(): boolean {
    return this.mode === 'measure';
  }
  get isRoute(): boolean {
    return this.mode === 'route';
  }
}
