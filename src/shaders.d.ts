// Шейдеры импортируются как строки. Загрузку выполняет application-сборка Angular
// через опцию "loader" в angular.json (".vert": "text", ".frag": "text").
declare module '*.vert' {
  const source: string;
  export default source;
}

declare module '*.frag' {
  const source: string;
  export default source;
}
