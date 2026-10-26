import { createContext, useContext } from 'react';
import { SceneStore } from './scene.store';

// null по умолчанию: стор существует только внутри Scene
export const SceneStoreContext = createContext<SceneStore | null>(null);

// Стор сцены для компонентов внутри Scene - аналог inject(SceneStore) в Angular
export function useSceneStore(): SceneStore {
  const store = useContext(SceneStoreContext);
  if (!store) throw new Error('useSceneStore: компонент должен быть внутри Scene (нет SceneStoreContext)');
  return store;
}
