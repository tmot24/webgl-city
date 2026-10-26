import { buildCityScene } from '@webgl-city/core/city/build-city-scene';
import { SCENE_MODES } from '@webgl-city/core/scene/scene-mode';
import { createCityRenderer } from '@webgl-city/core/render/create-city-renderer';

const { city } = buildCityScene();

export function App() {
  return (
    <div className="app">
      <div className="ui-panel control-hint">
        <div className="ui-panel__title">React · скелет</div>
        <div>Зданий: {city.buildings.length}</div>
        <div>Режимы: {SCENE_MODES.map(({ label }) => label).join(', ')}</div>
        <div>Рендерер из ядра: {typeof createCityRenderer}</div>
      </div>
    </div>
  );
}
