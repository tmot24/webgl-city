import { ConstructCubeGeometry } from '../geometry/construct-cube-geometry';
import { MaterialType } from './material.type';
import { createVAO, VaoAttribute } from '../mesh/create-vao';

// Собирает VAO под конкретный материал, вытягивая из геометрии нужные атрибуты
export function createDrawable({
  gl,
  geometry,
  material,
}: {
  gl: WebGL2RenderingContext;
  geometry: ConstructCubeGeometry;
  material: MaterialType;
}) {
  // материал говорит "мне нужны position и color" => берём эти массивы из геометрии
  const attributes: VaoAttribute[] = material.attributes.map(({ geometryKey, location, size }) => ({
    location,
    size,
    srcData: geometry[geometryKey], // отдельный буфер этого атрибута (stride 0)
  }));

  const { vao, buffers, indexBuffer } = createVAO({
    gl,
    attributes,
    indices: { srcData: geometry.indices },
  });

  return { vao, buffers, indexBuffer, count: geometry.count };
}
