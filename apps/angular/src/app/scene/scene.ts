import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { injectCityRender } from '../../render/inject-city-render';
import { injectBuildingPicker } from '../../features/building-pick/inject-building-picker';
import { BuildingInfo } from '../../features/building-pick/building-info/building-info';
import { ModeToolbar } from '../../features/mode/mode-toolbar/mode-toolbar';
import { MeasureLog } from '../../features/measure/measure-log/measure-log';
import { MeasureLabel } from '../../features/measure/measure-label/measure-label';
import { SnapMarker } from '../../features/measure/snap-marker/snap-marker';
import { ControlHint } from '../control-hint/control-hint';
import { ModeHint } from '../../features/mode/mode-hint/mode-hint';
import { isEditableTarget } from '@webgl-city/core/dom/is-editable-target';
import { RoutePanel } from '../../features/route/route-panel/route-panel';
import { buildCityScene } from '@webgl-city/core/city/build-city-scene';
import { SceneStore } from '../../store/scene.store';
import { SceneModStore } from '../../features/mode/scene-mod.store';
import { BuildingStore } from '../../features/building-pick/building.store';
import { MeasureStore } from '../../features/measure/measure.store';
import { RouteStore } from '../../features/route/route.store';
import { injectMeasure } from '../../features/measure/inject-measure';
import { injectRoute } from '../../features/route/inject-route';
import { SceneViewport } from '../../render/scene-viewport';
import { DEFAULT_LIGHT_DIRECTION } from '@webgl-city/core/city/city-default';
import { CITY_SCENE } from './city-scene.token';

@Component({
  imports: [BuildingInfo, ModeToolbar, MeasureLog, MeasureLabel, SnapMarker, ControlHint, ModeHint, RoutePanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scene',
  templateUrl: './scene.html',
  host: { class: 'scene', '(window:keydown.escape)': 'onEscape($event)' },
  providers: [
    // Город строится один раз на экземпляр сцены
    { provide: CITY_SCENE, useFactory: buildCityScene },
    SceneViewport,
    SceneStore,
    SceneModStore,
    BuildingStore,
    MeasureStore,
    RouteStore,
  ],
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly sceneStore = inject(SceneStore);
  protected readonly modeStore = inject(SceneModStore);
  protected readonly buildingStore = inject(BuildingStore);

  readonly lightDirectionNorm = signal(DEFAULT_LIGHT_DIRECTION);

  constructor() {
    // Рендер первым: он создаёт камеру и подключает SceneViewport, фичи берут её из DI
    injectCityRender({
      canvasRef: this.canvasRef,
      lightDirectionNorm: this.lightDirectionNorm,
      selectedBuilding: this.buildingStore.selected,
      activePolyline: this.sceneStore.activePolyline,
      isHighlightBuild: this.modeStore.is.building,
    });

    injectBuildingPicker();
    injectMeasure();
    injectRoute();
  }

  // Esc сбрасывает текущее действие режима
  protected onEscape(event: Event) {
    if (isEditableTarget(event.target)) return;
    this.sceneStore.cancelActiveAction();
  }
}
