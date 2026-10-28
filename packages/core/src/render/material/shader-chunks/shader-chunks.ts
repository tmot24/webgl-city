import shadowLit from './shadow-lit.glsl';

// Реестр переиспользуемых GLSL-кусков: имя из //#include <имя> -> исходник.
// Добавишь новый общий блок (свет, шум и т.п.) — регистрируешь его здесь.
export const SHADER_CHUNKS: Record<string, string> = {
  'shadow-lit': shadowLit,
};
