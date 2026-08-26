import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { generateCity } from '../../city/generate-city';
import { buildInstanceData } from '../../city/build-instance-data';
import { injectCityRender } from '../../inject/inject-city-render';
import { constructPlaneGeometry } from '../../helper/geometry/construct-plane-geometry';
import { buildRoadGeometry } from '../../road/build-road-geometry';
import { vec3 } from 'gl-matrix';

// Запас травы за границей застройки, метры
const GROUND_MARGIN = 100;

@Component({
  imports: [],
  selector: 'app-scene',
  styleUrl: './scene.css',
  templateUrl: './scene.html',
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly lightDirection = signal(vec3.normalize(vec3.create(), vec3.fromValues(0.6, 1.0, 0.4)));

  constructor() {
    const city = generateCity({ seed: 1 });
    const instanceData = buildInstanceData({ buildings: city.buildings });

    const { bounds } = city;
    const groundGeometry = constructPlaneGeometry({
      width: bounds.maxX - bounds.minX + GROUND_MARGIN * 2,
      depth: bounds.maxZ - bounds.minZ + GROUND_MARGIN * 2,
    });
    const roadGeometry = buildRoadGeometry({
      road: city.road,
      bounds,
    });

    injectCityRender({
      canvasRef: this.canvasRef,
      lightDirection: this.lightDirection,
      instanceData,
      ground: {
        groundGeometry,
        groundColor: vec3.fromValues(0.36, 0.55, 0.32),
      },
      road: {
        roadGeometry,
        roadColor: vec3.fromValues(0.25, 0.25, 0.27),
      },
    });
  }
}
