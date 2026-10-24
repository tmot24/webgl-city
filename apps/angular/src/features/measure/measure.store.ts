import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { vec3 } from 'gl-matrix';
import { computed } from '@angular/core';

export interface Measurement {
  id: number;
  a: vec3; // первая точка (мировые координаты)
  b: vec3; // вторая точка
}

export interface MeasureHover {
  point: vec3;
  snapped: boolean;
}

// Поля с "_" - приватные: снаружи стора их не видно
interface MeasureState {
  // завершённые измерения (пары точек)
  measurements: Measurement[];
  // выбранное в логе измерение
  selectedId: number | null;
  // точка залипания к углу здания/перекрёстку (для маркера)
  snapPoint: vec3 | null;
  // первая поставленная точка, ждём вторую (null - начинаем новое измерение)
  _pendingPoint: vec3 | null;
  // точка под курсором на поверхности (конец "резинки")
  _cursorPoint: vec3 | null;
  // счётчик id - часть состояния, чтобы стор оставался сериализуемым
  _nextId: number;
}

const initialState: MeasureState = {
  measurements: [],
  selectedId: null,
  snapPoint: null,
  _pendingPoint: null,
  _cursorPoint: null,
  _nextId: 1,
};

export const MeasureStore = signalStore(
  withState<MeasureState>(initialState),
  withComputed(({ measurements, selectedId, _pendingPoint, _cursorPoint }) => ({
    // Активный отрезок: тянущаяся "резинка", либо выбранное готовое измерение
    segment: computed(() => {
      const start = _pendingPoint();
      if (start) {
        const cursor = _cursorPoint();
        return cursor ? { a: start, b: cursor } : null;
      }
      const chosen = measurements().find(({ id }) => id === selectedId());
      return chosen ? { a: chosen.a, b: chosen.b } : null;
    }),
  })),
  withMethods((store) => ({
    // Клик: первая точка начинает отрезок, вторая - завершает измерение
    placePoint({ point }: { point: vec3 }) {
      const start = store._pendingPoint();
      if (!start) {
        patchState(store, { _pendingPoint: point, selectedId: null });
        return;
      }
      patchState(store, ({ measurements, _nextId }) => ({
        measurements: [...measurements, { id: _nextId, a: start, b: point }],
        selectedId: _nextId, // только что завершённое - сразу выбрано
        _nextId: _nextId + 1,
        _pendingPoint: null,
        _cursorPoint: null, // резинка больше не нужна
      }));
    },

    hover({ hit }: { hit: MeasureHover | null }) {
      patchState(store, {
        // маркер залипания (даже до первого клика)
        snapPoint: hit?.snapped ? hit.point : null,
        // резинка только между первой и второй точкой, null в небе => резинка скрыта
        ...(store._pendingPoint() && { _cursorPoint: hit?.point ?? null }),
      });
    },

    selectMeasurement({ id }: { id: number }) {
      patchState(store, { selectedId: id });
    },

    remove({ id }: { id: number }) {
      patchState(store, ({ measurements, selectedId }) => ({
        measurements: measurements.filter((item) => item.id !== id),
        selectedId: selectedId === id ? null : selectedId,
      }));
    },

    // Esc: отменить незавершённый отрезок и выбор
    cancel() {
      patchState(store, {
        _pendingPoint: null,
        _cursorPoint: null,
        snapPoint: null,
        selectedId: null,
      });
    },
  })),
);
