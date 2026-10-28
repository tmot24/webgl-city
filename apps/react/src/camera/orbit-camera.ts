import { mat4, vec3 } from 'gl-matrix';
import { OrbitSettings, OrbitState } from '@webgl-city/core/camera/orbit.type';
import {
  createOrbitState,
  DEFAULT_ORBIT_SETTINGS,
  orbitEye,
  orbitViewMatrix,
  panOrbit,
  rotateOrbit,
  zoomOrbit,
} from '@webgl-city/core/camera/orbit';
import { makeAutoObservable, observableRef } from 'mobx';

interface OrbitCameraOptions {
  // Положение наблюдателя на старте
  initialEye: vec3;
  // Куда смотрит камера на старте
  center?: vec3;
  // Верх смотрящего
  up?: vec3;
  // Переопределение чувствительности и пределов
  settings?: Partial<OrbitSettings>;
}

/**
 * MobX-стор орбитальной камеры: состояние - observable, производные - computed (геттеры),
 * переходы состояния - чистые функции из core.
 * */
export class OrbitCamera {
  // Неизменяемое значение: каждое действие кладёт новый объект => observableRef (без глубокой обёртки)
  state: OrbitState;

  private readonly settings: OrbitSettings;
  private readonly up: vec3 | undefined;

  constructor({ initialEye, center, up, settings }: OrbitCameraOptions) {
    this.state = createOrbitState({ eye: initialEye, center });
    this.settings = { ...DEFAULT_ORBIT_SETTINGS, ...settings };
    this.up = up;

    /**
     * makeAutoObservable - сам раскладывает аннотации:
     *  поля становятся observable,
     *  геттеры - computed,
     *  методы - action.
     * Переопределяем только то, где поведение по умолчанию не подходит.
     * */
    makeAutoObservable<OrbitCamera, 'settings' | 'up'>(
      this,
      // state - observableRef так как OrbitState неизменяемый, его целиком заменяют, поэтому достаточно отслеживать ссылку;
      // settings: false и up: false - это конфигурация, а не состояние, её не отслеживаем
      { state: observableRef, settings: false, up: false },
      // autoBind: методы можно передавать как callback (onRotate: camera.rotate)
      { autoBind: true },
    );
  }

  get eye(): vec3 {
    return orbitEye({ state: this.state });
  }

  get viewMatrix(): mat4 {
    return orbitViewMatrix({ state: this.state, up: this.up });
  }

  // при повороте ссылка center не меняется, поэтому этот computed не оповещает подписчиков (...спред)
  get center(): vec3 {
    return this.state.center;
  }

  get distance(): number {
    return this.state.radius;
  }

  rotate({ dx, dy }: { dx: number; dy: number }) {
    this.state = rotateOrbit({ state: this.state, dx, dy, settings: this.settings });
  }

  pan({ dx, dy }: { dx: number; dy: number }) {
    this.state = panOrbit({ state: this.state, dx, dy, settings: this.settings });
  }

  zoom({ deltaY }: { deltaY: number }) {
    this.state = zoomOrbit({ state: this.state, deltaY, settings: this.settings });
  }
}
