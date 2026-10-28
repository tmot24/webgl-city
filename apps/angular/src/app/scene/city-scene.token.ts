import { InjectionToken } from '@angular/core';
import { CityScene } from '@webgl-city/core/city/build-city-scene';

// Данные города сцены: прокидываются в Scene, строится один раз на экземпляр сцены
export const CITY_SCENE = new InjectionToken<CityScene>('CITY_SCENE');
