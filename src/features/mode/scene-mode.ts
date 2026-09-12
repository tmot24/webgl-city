export type SceneMode = 'building' | 'measure';

export interface SceneModeOption {
  id: SceneMode;
  label: string;
}

export const SCENE_MODES: SceneModeOption[] = [
  { id: 'building', label: 'Выбор здания' },
  { id: 'measure', label: 'Измерение' },
];

export const MODE_HINTS: Record<SceneMode, string> = {
  building:
    'Кликните левой кнопкой по любому зданию — покажется его высота, размеры и координаты. ' +
    'Клик по пустому месту снимет выделение.',
  measure:
    'Кликните левой кнопкой по двум точкам, чтобы измерить расстояние между ними. ' +
    'Точки прилипают к углам зданий и перекрёсткам (жёлтый кружок). ' +
    'Справа измерение можно выбрать кликом или удалить крестиком.',
};
