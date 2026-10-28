import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MeasureStore } from '../measure.store';
import { toMeasureRow } from '@webgl-city/core/measure/measurement';

@Component({
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-measure-log',
  templateUrl: './measure-log.html',
})
export class MeasureLog {
  protected readonly store = inject(MeasureStore);

  // Готовим формирование строки: длина, горизонталь, перепад высоты, координаты концов
  protected readonly rows = computed(() => {
    return this.store
      .measurements()
      .map((measurement) => toMeasureRow({ measurement }))
      .reverse();
  });
}
