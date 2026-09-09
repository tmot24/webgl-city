export type SceneMode = 'building' | 'measure';

export interface SceneModeOption {
  id: SceneMode;
  label: string;
}

export const SCENE_MODES: SceneModeOption[] = [
  { id: 'building', label: 'Выбор здания' },
  { id: 'measure', label: 'Измерение' },
];
