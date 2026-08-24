#version 300 es
precision highp float;

uniform vec3 u_Color;

out vec4 outColor;

void main() {
  outColor = vec4(u_Color, 1.0);
}
