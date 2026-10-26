import { observer } from 'mobx-react-lite';
import { MODE_HINTS } from '@webgl-city/core/scene/scene-mode';
import { useSceneStore } from '../../../store/scene-store.context';

// Подсказка для активного режима
export const ModeHint = observer(function ModeHint() {
  const { mode } = useSceneStore();
  return <div className="ui-panel mode-hint">{MODE_HINTS[mode.mode]}</div>;
});
