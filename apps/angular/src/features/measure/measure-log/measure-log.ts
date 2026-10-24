import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { vec3 } from 'gl-matrix';
import { MeasureStore } from '../measure.store';

@Component({
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-measure-log',
  styleUrl: './measure-log.css',
  templateUrl: './measure-log.html',
})
export class MeasureLog {
  protected readonly store = inject(MeasureStore);

  // Готовим формирование строки: длина, горизонталь, перепад высоты, координаты концов
  protected readonly rows = computed(() => {
    return this.store
      .measurements()
      .map(({ id, a, b }) => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        return {
          id,
          length: vec3.distance(a, b).toFixed(2),
          horizontal: Math.hypot(dx, dz).toFixed(2),
          height: Math.abs(dy).toFixed(2),
          ax: a[0].toFixed(0),
          ay: a[1].toFixed(0),
          az: a[2].toFixed(0),
          bx: b[0].toFixed(0),
          by: b[1].toFixed(0),
          bz: b[2].toFixed(0),
        };
      })
      .reverse();
  });
}
