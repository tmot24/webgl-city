import { Context, createContext, useContext } from 'react';

interface RequiredContext<T> {
  Context: Context<T | null>;
  useValue: () => T;
}

/**
 * Контекст, у которого нет значения по умолчанию: читать его можно только внутри провайдера.
 * */
export function createRequiredContext<T>({ name }: { name: string }): RequiredContext<T> {
  const Context = createContext<T | null>(null);
  // Имя в React DevTools вместо безликого "Context"
  Context.displayName = name;

  const useValue = (): T => {
    const value = useContext(Context);
    if (value === null) throw new Error(`${name} не найден: компонент должен быть внутри его провайдера`);
    return value;
  };

  return { Context, useValue };
}
