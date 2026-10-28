// Идёт ли ввод текста (input/textarea/contenteditable) - тогда не перехватываем клавиши
export function isEditableTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
