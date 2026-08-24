import { Component, ElementRef, viewChild } from '@angular/core';
import { generateCity } from '../../helper/city/generate-city';
import { buildInstanceData } from '../../helper/city/build-instance-data';
import { injectCityRender } from '../../inject/inject-city-render';

@Component({
  imports: [],
  selector: 'app-scene',
  styleUrl: './scene.css',
  templateUrl: './scene.html',
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    const city = generateCity({ seed: 1 });
    const instanceData = buildInstanceData({ buildings: city.buildings });

    injectCityRender({
      canvasRef: this.canvasRef,
      instanceData,
    });
  }
}
