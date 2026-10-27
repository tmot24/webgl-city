import { observer } from 'mobx-react-lite';
import { useSceneStore } from '../../store/scene-store.context';

// Сводка маршрута: длина и перекрёстки, либо подсказка, какую точку выбрать.
export const RoutePanel = observer(function RoutePanel() {
  const { route } = useSceneStore();
  const { info } = route;

  return (
    <div className="ui-panel route-panel">
      <div className="ui-panel__title">Маршрут</div>

      {info ? (
        <>
          <dl className="ui-stats">
            <dt>Длина</dt>
            <dd>{info.length}</dd>
            <dt>Перекрёстков</dt>
            <dd>{info.crossings}</dd>
          </dl>
          <button className="route-panel__reset" type="button" onClick={() => route.reset()}>
            Сбросить
          </button>
        </>
      ) : (
        <div className="ui-panel__hint">{route.awaitingFinish ? 'Выберите конечную точку' : 'Выберите 2 точки'}</div>
      )}
    </div>
  );
});
