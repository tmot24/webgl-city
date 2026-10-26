import { vec3 } from 'gl-matrix';
import { DEFAULT_LIGHT_DIRECTION } from '@webgl-city/core/city/city-default';
import { makeAutoObservable, observableRef } from 'mobx';

/**
 * Корневой стор сцены.
 * */
export class SceneStore {
  lightDirectionNorm: vec3 = DEFAULT_LIGHT_DIRECTION;
  castShadows = true;

  constructor() {
    // lightDirectionNorm: observableRef - нужен потому, что vec3 - это Float32Array;
    // глубокий observable на нём бессмыслен, вектор заменяется целиком
    makeAutoObservable(this, { lightDirectionNorm: observableRef }, { autoBind: true });
  }

  // id подсвечиваемого здания, -1 без подсветки
  get selectedId(): number {
    return -1;
  }

  // линия поверх сцены
  get activePolyline(): vec3[] | null {
    return null;
  }
}
