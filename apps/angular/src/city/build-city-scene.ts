import { generateCity } from './generate-city';
import { buildInstanceData } from './build-instance-data';
import { constructRoadGeometry } from './road/construct-road-geometry';
import { constructPlaneGeometry } from '../shared/geometry/construct-plane-geometry';
import { GROUND_MARGIN } from '../shared/constants';
import { GroundBounds } from '../shared/ray/intersect-ground';
import { buildingBox } from './building-box';

export function buildCityScene() {
  const city = generateCity({});
  const instanceData = buildInstanceData({ buildings: city.buildings });

  const roadGeometry = constructRoadGeometry({
    road: city.road,
    bounds: city.bounds,
  });

  const { bounds } = city;

  const groundWidth = bounds.maxX - bounds.minX + GROUND_MARGIN * 2;
  const groundDepth = bounds.maxZ - bounds.minZ + GROUND_MARGIN * 2;

  const groundGeometry = constructPlaneGeometry({
    width: groundWidth,
    depth: groundDepth,
  });
  const groundBounds: GroundBounds = {
    minX: -groundWidth / 2,
    maxX: groundWidth / 2,
    minZ: -groundDepth / 2,
    maxZ: groundDepth / 2,
  };

  const buildingBoxes = buildingBox({ buildings: city.buildings });

  return {
    city,
    instanceData,
    roadGeometry,
    groundGeometry,
    groundBounds,
    buildingBoxes,
  };
}
