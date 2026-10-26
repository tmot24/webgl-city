import { Measurement, MeasureSegment } from '@webgl-city/core/measure/measurement';
import { vec3 } from 'gl-matrix';
import { makeAutoObservable, observableShallow } from 'mobx';
import { MeasurePoint } from '@webgl-city/core/measure/create-measure-picker';

/**
 * Измерения расстояний: готовые отрезки, выбор в логе, "резинка" до второй точки и маркер залипания.
 * */
export class MeasureStore {
  // завершённые измерения (пары точек)
  measurements: Measurement[] = [];
  // выбранное в логе измерение
  selectedId: number | null = null;
  // точка залипания к углу здания/перекрёстку (для маркера)
  snapPoint: vec3 | null = null;

  // первая поставленная точка, ждём вторую (null - начинаем новое измерение)
  private pendingPoint: vec3 | null = null;
  // точка под курсором на поверхности (конец "резинки")
  private cursorPoint: vec3 | null = null;
  // счётчик id - служебный, в UI не участвует
  private nextId = 1;

  constructor() {
    makeAutoObservable<MeasureStore, 'nextId'>(
      this,
      {
        // сам массив observable (push/splice видны), а элементы - как есть, без обёртки (глубины)
        measurements: observableShallow,
        nextId: false,
      },
      { autoBind: true },
    );
  }

  // Активный отрезок: тянущаяся "резинка", либо выбранное готовое измерение
  get segment(): MeasureSegment | null {
    if (this.pendingPoint) {
      return this.cursorPoint ? { a: this.pendingPoint, b: this.cursorPoint } : null;
    }
    // само измерение - уже MeasureSegment (a, b): отдаём ту же ссылку, а не новый объект
    return this.measurements.find(({ id }) => id === this.selectedId) ?? null;
  }

  // Клик: первая точка начинает отрезок, вторая - завершает измерение
  placePoint({ point }: { point: vec3 }) {
    if (!this.pendingPoint) {
      this.pendingPoint = point;
      this.selectedId = null;
      return;
    }

    const id = this.nextId++;
    this.measurements.push({ id, a: this.pendingPoint, b: point });
    this.selectedId = id; // только что завершённое - сразу выбрано
    this.pendingPoint = null;
    this.cursorPoint = null; // резинка больше не нужна
  }

  hover({ hit }: { hit: MeasurePoint | null }) {
    // маркер залипания (даже до первого клика)
    this.snapPoint = hit?.snapped ? hit.point : null;
    // резинка только между первой и второй точкой; null в небе => резинка скрыта
    if (this.pendingPoint) {
      this.cursorPoint = hit?.point ?? null;
    }
  }

  remove({ id }: { id: number }) {
    const index = this.measurements.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.measurements.splice(index, 1);
    }
    if (this.selectedId === id) {
      this.selectedId = null;
    }
  }

  // Esc: отменить незавершённый отрезок и выбор
  cancel() {
    this.pendingPoint = null;
    this.cursorPoint = null;
    this.snapPoint = null;
    this.selectedId = null;
  }
}
