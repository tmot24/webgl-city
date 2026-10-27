import { useSceneStore } from '../../store/scene-store.context';
import { observer } from 'mobx-react-lite';
import { BuildingInfo } from '../../features/building-pick/building-info';
import { MeasureLog } from '../../features/measure/measure-log';
import { RoutePanel } from '../../features/route/route-panel';
import { MeasureLabel } from '../../features/measure/measure-label/measure-label';
import { SnapMarker } from '../../features/measure/snap-marker/snap-marker';

/**
 * Панели активного режима. Отдельный observer-компонент: смена режима перерисовывает только его, а не всю Scene.
 * */
export const ModePanels = observer(function ModePanels() {
  const { mode } = useSceneStore();

  return (
    <>
      {mode.isBuilding && <BuildingInfo />}
      {mode.isMeasure && (
        <>
          <MeasureLog />
          <MeasureLabel />
          <SnapMarker />
        </>
      )}
      {mode.isRoute && <RoutePanel />}
    </>
  );
});
