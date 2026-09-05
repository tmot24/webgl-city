// Общий блок теней (подключается директивой include в начале фрагментного шейдера).

// 1.0 = освещён, 0.0 = в тени. PCF 3x3 (усреднение 9 отсчётов => мягкий край) + bias против «теневого акне».
float shadowLit(sampler2D shadowMap, vec4 lightSpacePosition, float NdotL) {
  vec3 proj = lightSpacePosition.xyz / lightSpacePosition.w; // для орто w=1
  proj = proj * 0.5 + 0.5;                         // [-1,1] -> [0,1]

  if (proj.z > 1.0) return 1.0;
  if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0) return 1.0;

  float bias = max(0.0004, 0.002 * (1.0 - NdotL)); // прямым к свету - почти ноль, скользящим - больше
  vec2 texel = 1.0 / vec2(textureSize(shadowMap, 0));

  float lit = 0.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float closest = texture(shadowMap, proj.xy + vec2(float(x), float(y)) * texel).r;
      lit += proj.z - bias > closest ? 0.0 : 1.0;
    }
  }
  return lit / 9.0;
}
