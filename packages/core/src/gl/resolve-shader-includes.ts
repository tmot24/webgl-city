interface ResolveShaderIncludes {
  // Исходник шейдера с маркерами //#incude <имя>
  source: string;
  // Реестр кусков: имя из маркера => GLSL-исходник
  chunks: Record<string, string>;
}

/**
 * Разворачивает //#incude <имя> в текст шейдера: заменяет каждый маркер на исходник чанка.
 * Маркер доложен стоять отдельной строкой. Один проход (чанки сами не разворачиваются).
 * Неизвестное имя - ошибка сразу, чтобы не ловить её в невнятной ошибке компиляции GLSL/
 * */
export function resolveShaderIncludes({ source, chunks }: ResolveShaderIncludes): string {
  return source.replace(/^[ \t]*\/\/#include[ \t]+(\S+)[ \t]*$/gm, (_match, name: string) => {
    const chunk = chunks[name];
    if (chunk === undefined) {
      throw new Error(`Неизвестный шейдер-чанк в //#include: "${name}"`);
    }
    return chunk;
  });
}
