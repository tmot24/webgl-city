#version 300 es
precision highp float;

// location 0 — совпадает с FLAT_ATTRIBUTES_LOCATION.position
layout(location = 0) in vec3 a_Position;

uniform mat4 u_ViewProjection;
uniform mat4 u_LightViewProjection; // "взгляд из солнца" — для выборки тени

out vec4 v_LightSpacePosition;

void main() {
  // Позиции травы/дорог уже в мировых координатах.
  v_LightSpacePosition = u_LightViewProjection * vec4(a_Position, 1.0);

  gl_Position = u_ViewProjection * vec4(a_Position, 1.0);
}
