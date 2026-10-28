import { useSceneStore } from '../../../store/scene-store.context';
import { SCENE_MODES } from '@webgl-city/core/scene/scene-mode';
import { observer } from 'mobx-react-lite';

// Переключатель режимов сцены
export const ModeToolbar = observer(function ModeToolBar() {
  const { mode } = useSceneStore();

  return (
    <div className="mode-toolbar">
      {SCENE_MODES.map((option) => (
        <button
          key={option.id}
          type="button"
          className={option.id === mode.mode ? 'mode-toolbar__tab mode-toolbar__tab_active' : 'mode-toolbar__tab'}
          onClick={() => mode.setMode({ mode: option.id })}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});
