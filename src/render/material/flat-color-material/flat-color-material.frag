#version 300 es
precision highp float;

//#include shadow-lit

in vec4 v_LightSpacePosition;

uniform vec3 u_Color;
uniform sampler2D u_ShadowMap;

out vec4 outColor;

const float SHADOW_MIN = 0.7; // насколько темнеет поверхность в тени (0 — чёрная, 1 — без тени)

void main() {
  // Плоская поверхность: цвет как есть, но темнеет там, где на неё падает тень зданий.
  // NdotL - 1.0, плоскость смотрит вверх
  float shade = mix(SHADOW_MIN, 1.0, shadowLit(u_ShadowMap, v_LightSpacePosition, 1.0));
  outColor = vec4(u_Color * shade, 1.0);
}
