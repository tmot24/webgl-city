// Бинарная min-куча по числовому приоритету: push за O(log n), извлечение минимума (pop) за O(log n)/
// Приоритетная очередь для A* (и не только).
export class MinHeap<T> {
  private readonly items: { value: T; priority: number }[] = [];

  get size(): number {
    return this.items.length;
  }

  push({ value, priority }: { value: T; priority: number }): void {
    this.items.push({ value, priority });
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;

    const top = items[0].value;
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  // Поднимает элемент, пока он меньше родителя
  private bubbleUp(index: number): void {
    const items = this.items;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2); // (index - 1) >> 1 (побитовый сдвиг вправо)
      if (items[index].priority >= items[parent].priority) break;
      [items[index], items[parent]] = [items[parent], items[index]];
      index = parent;
    }
  }

  // Опускает элемент к меньшему из детей, пока не встанет на место
  private bubbleDown(index: number): void {
    const items = this.items;
    const length = items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (left < length && items[left].priority < items[smallest].priority) smallest = left;
      if (right < length && items[right].priority < items[smallest].priority) smallest = right;
      if (smallest === index) break;
      [items[index], items[smallest]] = [items[smallest], items[index]];
      index = smallest;
    }
  }
}
