#version 300 es
precision highp float;

// location 0 — совпадает с FLAT_ATTRIBUTES_LOCATION.position
layout(location = 0) in vec3 a_Position;

uniform mat4 u_ViewProjection;

void main() {
  gl_Position = u_ViewProjection * vec4(a_Position, 1.0);
}
