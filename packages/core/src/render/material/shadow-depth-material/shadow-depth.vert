#version 300 es
precision highp float;

// Локации совпадают с BUILDING_ATTRIBUTES_LOCATION: position=0, translation=2, scale=3.
// normal (1) для глубины не нужен — не объявляем.
layout(location = 0) in vec3 a_Position; // единичный куб на полу
layout(location = 2) in vec3 a_Translation; // per-instance: позиция здания
layout(location = 3) in vec3 a_Scale; // per-instance: габариты

uniform mat4 u_LightViewProjection; // «взгляд из солнца»

void main() {
  // Та же модель, что в основном шейдере, но в клип-пространство света.
  vec3 worldPosition = a_Position * a_Scale + a_Translation;
  gl_Position = u_LightViewProjection * vec4(worldPosition, 1.0);
}
