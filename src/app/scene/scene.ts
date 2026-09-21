import { ChangeDetectionStrategy, Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { injectCityRender } from '../../render/inject-city-render';
import { vec3 } from 'gl-matrix';
import { Building } from '../../city/generate-city.types';
import { injectBuildingPicker } from '../../features/building-pick/inject-building-picker';
import { BuildingInfo } from '../../features/building-pick/building-info/building-info';
import { ModeToolbar } from '../../features/mode/mode-toolbar/mode-toolbar';
import { SceneMode } from '../../features/mode/scene-mode';
import { MeasureLog } from '../../features/measure/measure-log/measure-log';
import { MeasureLabel } from '../../features/measure/measure-label/measure-label';
import { SnapMarker } from '../../features/measure/snap-marker/snap-marker';
import { ControlHint } from '../control-hint/control-hint';
import { ModeHint } from '../../features/mode/mode-hint/mode-hint';
import { isEditableTarget } from '../../shared/dom/is-editable-target';
import { RoutePanel } from '../../features/route/route-panel/route-panel';
import { buildCityScene } from '../../city/build-city-scene';
import { injectMeasureState, MeasureState } from '../../features/measure/inject-measure-state';
import { injectRouteState, RouteState } from '../../features/route/inject-route-state';

@Component({
  imports: [BuildingInfo, ModeToolbar, MeasureLog, MeasureLabel, SnapMarker, ControlHint, ModeHint, RoutePanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scene',
  styleUrl: './scene.css',
  templateUrl: './scene.html',
  host: { '(window:keydown.escape)': 'onEscape($event)' },
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly lightDirection = signal(vec3.normalize(vec3.create(), vec3.fromValues(0.6, 1.0, 0.4)));

  protected readonly activeMode = signal<SceneMode>('building');
  // building
  protected readonly selectedBuilding = signal<Building | null>(null);
  // measure
  protected readonly measureState!: MeasureState;
  // route
  protected readonly routeState!: RouteState;

  protected readonly activePolyline = computed(() => {
    const mode = this.activeMode();
    if (mode === 'measure') {
      const segment = this.measureState.segment();
      return segment ? [segment.a, segment.b] : null;
    }
    if (mode === 'route') {
      const ids = this.routeState.route();
      return ids ? ids.map((id) => this.routeState.graph.nodes[id].position) : null;
    }
    return null;
  });

  constructor() {
    const { city, instanceData, groundBounds, groundGeometry, roadGeometry, buildingBoxes } = buildCityScene();

    const { viewProjection, eyePoint, size } = injectCityRender({
      canvasRef: this.canvasRef,
      lightDirection: this.lightDirection,
      instanceData,
      selectedBuilding: this.selectedBuilding,
      activePolyline: this.activePolyline,
      ground: {
        groundGeometry,
        groundColor: vec3.fromValues(0.36, 0.55, 0.32),
      },
      road: {
        roadGeometry,
        roadColor: vec3.fromValues(0.25, 0.25, 0.27),
      },
      isHighlightBuild: computed(() => this.activeMode() === 'building'),
    });

    injectBuildingPicker({
      canvasRef: this.canvasRef,
      buildingBoxes,
      viewProjection,
      eyePoint,
      selected: this.selectedBuilding,
      enabled: computed(() => this.activeMode() === 'building'),
    });

    this.measureState = injectMeasureState({
      canvasRef: this.canvasRef,
      buildingBoxes,
      road: city.road,
      viewProjection,
      eyePoint,
      groundBounds,
      viewportSize: size,
      enabled: computed(() => this.activeMode() === 'measure'),
    });

    this.routeState = injectRouteState({
      canvasRef: this.canvasRef,
      viewProjection,
      eyePoint,
      road: city.road,
      groundBounds,
      enabled: computed(() => this.activeMode() === 'route'),
    });
  }

  // Esc сбрасывает текущее действие режима
  protected onEscape(event: Event) {
    if (isEditableTarget(event.target)) return;

    if (this.activeMode() === 'building') {
      this.selectedBuilding.set(null);
    } else if (this.activeMode() === 'measure') {
      this.measureState.reset();
    } else if (this.activeMode() === 'route') {
      this.routeState.reset();
    }
  }
}
