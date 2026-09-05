import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Building } from '../../city/generate-city.types';

@Component({
  imports: [],
  selector: 'app-building-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './building-info.css',
  templateUrl: './building-info.html',
})
export class BuildingInfo {
  readonly building = input<Building | null>();

  protected readonly info = computed(() => {
    const build = this.building();
    if (!build) return null;
    return {
      id: build.id,
      height: build.height.toFixed(2),
      width: build.width.toFixed(2),
      depth: build.depth.toFixed(2),
      area: (build.width * build.depth).toFixed(2),
      floors: Math.max(1, Math.round(build.height / 3.5)),
      x: build.cx.toFixed(0),
      z: build.cz.toFixed(0),
    };
  });
}
