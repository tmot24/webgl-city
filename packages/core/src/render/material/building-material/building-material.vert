#version 300 es
precision highp float;

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec3 a_Translation;
layout(location = 3) in vec3 a_Scale;

uniform mat4 u_ViewProjection;
uniform mat4 u_LightViewProjection; // «взгляд из солнца» — для выборки тени во фрагменте

out vec3 v_Normal;
out vec4 v_LightSpacePosition; // позиция фрагмента в клип-пространстве света
flat out int v_InstanceId; // номер инстанса (здания); flat - передача во фрагментый шейдер без интерполяции

void main() {
  // Модельная трансформация без матрицы: сначала масштаб, затем перенос
  vec3 worldPosition = a_Position * a_Scale + a_Translation;
  // Нормальная матрица = обратно-транспонировання линейная часть модели.
  // Для translate+scale линейная часть = diag(a_Scale), обратно-транспонированная = diag(1.0 / a_Scale).
  // Так корректно учитывается НЕравномерный масштаб; при добавлении поворотов расширять здесь.
  v_Normal = normalize(a_Normal / a_Scale);

  // Та же мировая точка, но в пространстве света — во фрагменте сравним её глубину с картой теней.
  v_LightSpacePosition = u_LightViewProjection * vec4(worldPosition, 1.0);
  v_InstanceId = gl_InstanceID;
  gl_Position = u_ViewProjection * vec4(worldPosition, 1.0);
}
