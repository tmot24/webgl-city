import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BuildingStore } from '../building.store';
import { toBuildingInfo } from '@webgl-city/core/city/building-info';

@Component({
  imports: [],
  selector: 'app-building-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './building-info.html',
})
export class BuildingInfo {
  protected readonly store = inject(BuildingStore);

  protected readonly info = computed(() => {
    const building = this.store.selected();
    return building ? toBuildingInfo({ building }) : null;
  });
}
