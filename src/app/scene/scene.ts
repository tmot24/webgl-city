import { ChangeDetectionStrategy, Component, computed, ElementRef, signal, viewChild } from '@angular/core';
import { generateCity } from '../../city/generate-city';
import { buildInstanceData } from '../../city/build-instance-data';
import { injectCityRender } from '../../inject/inject-city-render';
import { constructPlaneGeometry } from '../../helper/geometry/construct-plane-geometry';
import { buildRoadGeometry } from '../../road/build-road-geometry';
import { vec3 } from 'gl-matrix';
import { Building } from '../../city/generate-city.types';
import { injectBuildingPicker } from '../../inject/inject-building-picker';
import { BuildingInfo } from '../building-info/building-info';
import { ModeToolbar } from '../mode-toolbar/mode-toolbar';
import { SceneMode } from '../mode-toolbar/scene-mode';
import { injectMeasure, Measurement } from '../../inject/inject-measure';
import { MeasureLog } from '../measure-log/measure-log';
import { GroundBounds } from '../../helper/hit-box/intersect-ground';

// Запас травы за границей застройки, метры
const GROUND_MARGIN = 100;

@Component({
  imports: [BuildingInfo, ModeToolbar, MeasureLog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scene',
  styleUrl: './scene.css',
  templateUrl: './scene.html',
})
export class Scene {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly lightDirection = signal(vec3.normalize(vec3.create(), vec3.fromValues(0.6, 1.0, 0.4)));

  protected readonly activeMode = signal<SceneMode>('building');

  // mode - building
  protected readonly selectedBuilding = signal<Building | null>(null);
  // mode - measure
  protected readonly measurements = signal<Measurement[]>([]);
  protected readonly pendingPoint = signal<vec3 | null>(null);
  protected readonly cursorPoint = signal<vec3 | null>(null);
  protected readonly activeLineSegment = computed(() => {
    if (this.activeMode() !== 'measure') return null;
    const start = this.pendingPoint();
    if (start) {
      const cursor = this.cursorPoint();
      return cursor ? { a: start, b: cursor } : null;
    }
    const last = this.measurements().at(-1);
    return last ? { a: last.a, b: last.b } : null;
  });

  constructor() {
    const city = generateCity({ seed: 1 });
    const instanceData = buildInstanceData({ buildings: city.buildings });

    const { bounds } = city;
    const groundWidth = bounds.maxX - bounds.minX + GROUND_MARGIN * 2;
    const groundDepth = bounds.maxZ - bounds.minZ + GROUND_MARGIN * 2;
    const groundGeometry = constructPlaneGeometry({
      width: groundWidth,
      depth: groundDepth,
    });
    const groundBounds: GroundBounds = {
      minX: -groundWidth / 2,
      maxX: groundWidth / 2,
      minZ: -groundDepth / 2,
      maxZ: groundDepth / 2,
    };
    const roadGeometry = buildRoadGeometry({
      road: city.road,
      bounds,
    });

    // Радиус охватывающей сферы города (от центра-начала координат до дальнего верхнего угла):
    // задаёт размер ортобокса карты теней
    const maxHeight = city.buildings.reduce((max, { height }) => Math.max(max, height), 0);
    const sceneRadius = Math.hypot(bounds.maxX, maxHeight, bounds.maxZ);

    const { viewProjection, eyePoint } = injectCityRender({
      canvasRef: this.canvasRef,
      lightDirection: this.lightDirection,
      instanceData,
      sceneRadius,
      selectedBuilding: this.selectedBuilding,
      activeLineSegment: this.activeLineSegment,
      ground: {
        groundGeometry,
        groundColor: vec3.fromValues(0.36, 0.55, 0.32),
      },
      road: {
        roadGeometry,
        roadColor: vec3.fromValues(0.25, 0.25, 0.27),
      },
    });

    injectBuildingPicker({
      canvasRef: this.canvasRef,
      buildings: city.buildings,
      viewProjection,
      eyePoint,
      selected: this.selectedBuilding,
      enabled: computed(() => this.activeMode() === 'building'),
    });

    injectMeasure({
      canvasRef: this.canvasRef,
      buildings: city.buildings,
      viewProjection,
      eyePoint,
      measurements: this.measurements,
      pending: this.pendingPoint,
      cursorPoint: this.cursorPoint,
      groundBounds,
      enabled: computed(() => this.activeMode() === 'measure'),
    });
  }
}
