import { createRequiredContext } from '../shared/create-required-context';
import { SceneViewport } from './scene-viewport';

const sceneViewportContext = createRequiredContext<SceneViewport>({ name: 'SceneViewportContext' });

export const SceneViewportContext = sceneViewportContext.Context;
export const useSceneViewportContext = sceneViewportContext.useValue;
