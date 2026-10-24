import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { injectCityRender } from '../../render/inject-city-render';
import { vec3 } from 'gl-matrix';
import { injectBuildingPicker } from '../../features/building-pick/inject-building-picker';
import { BuildingInfo } from '../../features/building-pick/building-info/building-info';
import { ModeToolbar } from '../../features/mode/mode-toolbar/mode-toolbar';
import { MeasureLog } from '../../features/measure/measure-log/measure-log';
import { MeasureLabel } from '../../features/measure/measure-label/measure-label';
import { SnapMarker } from '../../features/measure/snap-marker/snap-marker';
import { ControlHint } from '../control-hint/control-hint';
import { ModeHint } from '../../features/mode/mode-hint/mode-hint';
import { isEditableTarget } from '../../shared/dom/is-editable-target';
import { RoutePanel } from '../../features/route/route-panel/route-panel';
import { buildCityScene } from '../../city/build-city-scene';
import { SceneStore } from '../../store/scene.store';
import { SceneModStore } from '../../features/mode/scene-mod.store';
import { BuildingStore } from '../../features/building-pick/building.store';
import { MeasureStore } from '../../features/measure/measure.store';
import { RouteStore } from '../../features/route/route.store';
import { injectMeasure } from '../../features/measure/inject-measure';
import { injectRoute } from '../../features/route/inject-route';
import { SceneViewport } from '../../render/scene-viewport';

@Component({
  imports: [BuildingInfo, ModeToolbar, MeasureLog, MeasureLabel, SnapMarker, ControlHint, ModeHint, RoutePanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scene',
  styleUrl: './scene.css',
  templateUrl: './scene.html',
  host: { '(window:keydown.escape)': 'onEscape($event)' },
  providers: [SceneViewport, SceneStore, SceneModStore, BuildingStore, MeasureStore, RouteStore],
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly lightDirection = signal(vec3.normalize(vec3.create(), vec3.fromValues(0.6, 1.0, 0.4)));

  protected readonly sceneStore = inject(SceneStore);
  protected readonly modeStore = inject(SceneModStore);
  protected readonly buildingStore = inject(BuildingStore);

  constructor() {
    const { city, instanceData, groundBounds, groundGeometry, roadGeometry, buildingBoxes } = buildCityScene();

    const { viewProjection, eyePoint, size } = injectCityRender({
      canvasRef: this.canvasRef,
      lightDirection: this.lightDirection,
      instanceData,
      selectedBuilding: this.buildingStore.selected,
      activePolyline: this.sceneStore.activePolyline,
      ground: {
        groundGeometry,
        groundColor: vec3.fromValues(0.36, 0.55, 0.32),
      },
      road: {
        roadGeometry,
        roadColor: vec3.fromValues(0.25, 0.25, 0.27),
      },
      isHighlightBuild: this.modeStore.is.building,
    });

    // Камера для UI-оверлея (проекция мир => экран в дочерних фичах)
    inject(SceneViewport).connect({ canvasRef: this.canvasRef, viewProjection, size });

    injectBuildingPicker({
      canvasRef: this.canvasRef,
      buildingBoxes,
      viewProjection,
      eyePoint,
    });

    injectMeasure({
      canvasRef: this.canvasRef,
      buildingBoxes,
      road: city.road,
      viewProjection,
      eyePoint,
      groundBounds,
    });

    injectRoute({
      canvasRef: this.canvasRef,
      viewProjection,
      eyePoint,
      road: city.road,
      groundBounds,
    });
  }

  // Esc сбрасывает текущее действие режима
  protected onEscape(event: Event) {
    if (isEditableTarget(event.target)) return;
    this.sceneStore.cancelActiveAction();
  }
}
