#version 300 es
precision highp float;

//#include shadow-lit

in vec3 v_Normal;
in vec4 v_LightSpacePosition; // позиция фрагмента в клип-пространстве света
flat in int v_InstanceId;

uniform vec3 u_LightDirection; // направление НА свет (нормализованное), в мировых координатах
uniform sampler2D u_ShadowMap; // карта теней: глубина из «взгляда солнца»
uniform int u_SelectedId; // выбранное здание; -1 = ничего не выбранно

out vec4 outColor;

const vec3 BUILDING_COLOR = vec3(0.85); // светло-серые здания
const float AMBIENT = 0.25; // фоновая подсветка (нижний «пол» яркости)
const float SHADOW_MIN = 0.6; // сколько солнечного света остаётся в падающей тени (0 - гасим полностью)
const vec3 HIGHTLIGHT_COLOR = vec3(1.0, 0.85, 0.2); // тёплый акцент на выбранном

void main() {
  vec3 normal = normalize(v_Normal);
  // "Сырой" косинус к свету: >0 грань смотрит на солнце, <=0 - отвёрнута
  float NdotL = dot(normal, u_LightDirection);

  // Half-Lambert: свет «заворачивается» за терминатор (это линия (граница) между освещённой и неосвещённой сторонами),
  // поэтому грани, повёрнутые вбок и слегка от света, не проваливаются в темень —
  // перпендикулярная свету стена получает ~0.5 вместо 0. Приём из Half-Life 2.
  float diffuse = NdotL * 0.5 + 0.5; // half-lambert [0..1]
  // dot - Умножает соответствующие компоненты двух векторов и суммирует результаты.
  // dot() — это как "похожесть" двух направлений.
  // Если векторы смотрят в одну сторону => результат большой (положительный).
  // Если в разные → отрицательный. Если перпендикулярны → ноль.


  // Падающая тень применяем только к граням, смотрящим на солнце (NdotL > 0).
  // На отвёрнутых (NdotL <= 0) тень не нужна - они и так в собственной тени.
  float lit = mix(1.0, shadowLit(u_ShadowMap, v_LightSpacePosition, NdotL), clamp(NdotL, 0.0, 1.0));
  diffuse *= mix(SHADOW_MIN, 1.0, lit);

  float light = AMBIENT + (1.0 - AMBIENT) * diffuse;
  vec3 base = BUILDING_COLOR;
  // Выбранное здание тонируем, сохраняя объём (свет остаётся сверху)
  if (v_InstanceId == u_SelectedId) {
    base = mix(base, HIGHTLIGHT_COLOR, 0.6);
  }
  outColor = vec4(base * light, 1.0);
}
