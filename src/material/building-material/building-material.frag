#version 300 es
precision highp float;

//#include shadow-lit

in vec3 v_Normal;
in vec4 v_LightSpacePosition; // позиция фрагмента в клип-пространстве света

uniform vec3 u_LightDirection; // направление НА свет (нормализованное), в мировых координатах
//uniform sampler2D u_ShadowMap; // карта теней: глубина из «взгляда солнца»

out vec4 outColor;

const vec3 BUILDING_COLOR = vec3(0.82); // светло-серые здания
const float AMBIENT = 0.3; // фоновая подсветка (нижний «пол» яркости)

void main() {
  vec3 normal = normalize(v_Normal);

  // Half-Lambert: свет «заворачивается» за терминатор (это линия (граница) между освещённой и неосвещённой сторонами),
  // поэтому грани, повёрнутые вбок и слегка от света, не проваливаются в темень —
  // перпендикулярная свету стена получает ~0.5 вместо 0. Приём из Half-Life 2.
  float diffuse = dot(normal, u_LightDirection) * 0.5 + 0.5; // [0..1]
  // dot - Умножает соответствующие компоненты двух векторов и суммирует результаты.
  // dot() — это как "похожесть" двух направлений.
  // Если векторы смотрят в одну сторону => результат большой (положительный).
  // Если в разные → отрицательный. Если перпендикулярны → ноль.

  // Тень гасит именно солнечный (диффузный) член; AMBIENT остаётся полом.
  diffuse *= shadowLit(v_LightSpacePosition);

  float light = AMBIENT + (1.0 - AMBIENT) * diffuse;
  outColor = vec4(BUILDING_COLOR * light, 1.0);
}
