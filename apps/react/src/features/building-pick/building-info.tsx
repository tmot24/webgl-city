import { observer } from 'mobx-react-lite';
import { useSceneStore } from '../../store/scene-store.context';
import { toBuildingInfo } from '@webgl-city/core/city/building-info';

// Информация о выбранном здании
export const BuildingInfo = observer(function BuildingInfo() {
  const { selected } = useSceneStore().building;

  if (!selected) {
    return (
      <div className="ui-panel building-info">
        <div className="ui-panel__hint">Выберите здание</div>
      </div>
    );
  }

  const info = toBuildingInfo({ building: selected });

  return (
    <div className="ui-panel building-info">
      <div className="ui-panel__title">Здание #{info.id}</div>
      <dl className="ui-stats">
        <dt>Высота</dt>
        <dd>{info.height}</dd>
        <dt>Основание</dt>
        <dd>
          {info.width} × {info.depth}
        </dd>
        <dt>Площадь</dt>
        <dd>{info.area} м²</dd>
        <dt>Этажей ≈</dt>
        <dd>{info.floors}</dd>
        <dt>Позиция</dt>
        <dd>
          X: {info.x} Z: {info.z}
        </dd>
      </dl>
    </div>
  );
});
