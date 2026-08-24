#version 300 es
precision highp float;

in vec3 v_Normal;

uniform vec3 u_LightDirection; // направление НА свет (нормализованное), в мировых координатах

out vec4 outColor;

const vec3 BUILDING_COLOR = vec3(0.85);
const float AMBIENT = 0.25; // фоновая подсветка

void main() {
  vec3 normal = normalize(v_Normal);
  // dot - Умножает соответствующие компоненты двух векторов и суммирует результаты.
  // dot() — это как "похожесть" двух направлений.
  // Если векторы смотрят в одну сторону => результат большой (положительный).
  // Если в разные → отрицательный. Если перпендикулярны → ноль.
  float diffuse = max(dot(normal, u_LightDirection), 0.0);
  float light = AMBIENT + (1.0 - AMBIENT) * diffuse;
  outColor = vec4(BUILDING_COLOR * light, 1.0);
}
