import { useEffect, useEffectEvent } from 'react';
import { isEditableTarget } from '@webgl-city/core/dom/is-editable-target';

interface UseEscapeKey {
  onEscape: () => void;
}

/**
 * Esc на всём окне (не только над canvas). В полях ввода не перехватывается.
 * */
export function useEscapeKey({ onEscape }: UseEscapeKey) {
  const handleEscape = useEffectEvent(onEscape);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isEditableTarget(event.target)) return;
      handleEscape();
    };

    window.addEventListener('keydown', keyDownHandler);
    return () => window.removeEventListener('keydown', keyDownHandler);
  }, []);
}
