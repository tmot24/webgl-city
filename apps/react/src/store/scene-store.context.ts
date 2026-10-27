import { createRequiredContext } from '../shared/create-required-context';
import { SceneStore } from './scene.store';

const sceneStoreContext = createRequiredContext<SceneStore>({ name: 'SceneStoreContext' });

export const SceneStoreContext = sceneStoreContext.Context;
export const useSceneStore = sceneStoreContext.useValue;
