interface cssToNdc {
  event: MouseEvent;
  rect: DOMRect;
}

/**
 * CSS-пиксели => NDC [-1, 1] (Y инвертируем) NDC = Normalized Device Coordinates
 * */
export function cssToNdc({ event, rect }: cssToNdc) {
  const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = 1 - ((event.clientY - rect.top) / rect.height) * 2;

  return {
    ndcX,
    ndcY,
  };
}
