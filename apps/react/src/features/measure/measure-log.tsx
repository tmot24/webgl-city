import { observer } from 'mobx-react-lite';
import { useSceneStore } from '../../store/scene-store.context';
import { toMeasureRow } from '@webgl-city/core/measure/measurement';

export const MeasureLog = observer(function MeasureLog() {
  const { measure } = useSceneStore();
  // Свежие измерения сверху
  const rows = measure.measurements.map((measurement) => toMeasureRow({ measurement })).reverse();

  return (
    <div className="ui-panel measure-log">
      {rows.length > 0 ? (
        <>
          <div className="ui-panel__title">Измерения</div>
          <ol className="measure-log__list ui-scroll">
            {rows.map((row) => (
              <li
                key={row.id}
                className={
                  row.id === measure.selectedId ? 'measure-log__item measure-log__item_selected' : 'measure-log__item'
                }
                onClick={() => measure.selectMeasurement({ id: row.id })}
              >
                <button
                  className="measure-log__remove"
                  type="button"
                  title="Удалить"
                  onClick={(event) => {
                    // клик по крестику не должен заодно выбирать строку
                    event.stopPropagation();
                    measure.remove({ id: row.id });
                  }}
                >
                  ×
                </button>
                <div className="measure-log__length">
                  #{row.id} · {row.length} м
                </div>
                <div className="measure-log__sub">Горизонталь {row.horizontal}</div>
                <div className="measure-log__sub">Высота {row.height} м</div>
                <div className="measure-log__points">
                  A ({row.ax}, {row.ay}, {row.az})
                </div>
                <div className="measure-log__points">
                  B ({row.bx}, {row.by}, {row.bz})
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="ui-panel__hint">Выберите две точки</div>
      )}
    </div>
  );
});
