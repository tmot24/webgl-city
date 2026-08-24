#version 300 es
precision highp float;

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec3 a_Translation;
layout(location = 3) in vec3 a_Scale;

uniform mat4 u_ViewProjection;

out vec3 v_Normal;

void main() {
  // Модельная трансформация без матрицы: сначала масштаб, затем перенос
  vec3 worldPosition = a_Position * a_Scale + a_Translation;
  // Нормальная матрица = обратно-транспонировання линейная часть модели.
  // Для translate+scale линейная часть = diag(a_Scale), обратно-транспонированная = diag(1.0 / a_Scale).
  // Так корректно учитывается НЕравномерный масштаб; при добавлении поворотов расширять здесь.
  v_Normal = normalize(a_Normal / a_Scale);

  gl_Position = u_ViewProjection * vec4(worldPosition, 1.0);
}
