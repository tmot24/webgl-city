// Общий блок теней (подключается директивой include в начале фрагментного шейдера).
// Держит и контракт (карту теней + позицию фрагмента в свете), и саму выборку — всё в одном месте.
uniform sampler2D u_ShadowMap; // карта теней: глубина из «взгляда солнца»

// 1.0 = освещён, 0.0 = в тени. PCF 3x3 (усреднение 9 отсчётов => мягкий край) + bias против «теневого акне».
float shadowLit(vec4 lightSpacePosition) {
  vec3 proj = lightSpacePosition.xyz / lightSpacePosition.w; // для орто w=1
  proj = proj * 0.5 + 0.5;                         // [-1,1] -> [0,1]

  if (proj.z > 1.0) return 1.0;
  if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0) return 1.0;

  float bias = 0.0015; // ~3 м в мире; больше — «отрыв» тени, меньше — акне
  vec2 texel = 1.0 / vec2(textureSize(u_ShadowMap, 0));

  float lit = 0.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float closest = texture(u_ShadowMap, proj.xy + vec2(float(x), float(y)) * texel).r;
      lit += proj.z - bias > closest ? 0.0 : 1.0;
    }
  }
  return lit / 9.0;
}
