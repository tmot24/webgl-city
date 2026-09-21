interface Item {
  // id узла
  value: number;
  // расстояние
  priority: number;
}

/**
 * Бинарная min-куча по числовому приоритету: push за O(log n), извлечение минимума (pop) за O(log n).
 * Приоритетная очередь для A* (и не только).
 * каждый родитель ≤ своих детей
 *             [0]=2
 *           /       \
 *       [1]=5       [2]=3
 *       /   \       /
 *   [3]=9  [4]=6  [5]=4
 *
 * items = [2, 5, 3, 9, 6, 4]
 * */
export class MinHeap {
  private readonly items: Item[] = [];

  get size(): number {
    return this.items.length;
  }

  push({ value, priority }: Item): void {
    this.items.push({ value, priority });
    this.bubbleUp(this.items.length - 1);
  }

  pop(): number | undefined {
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
    const item = items[index]; // держим поднимаемый элемент "в руке"
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2); // (index - 1) >> 1 (побитовый сдвиг вправо)
      if (item.priority >= items[parent].priority) break; // сравниваем именно item
      items[index] = items[parent]; // сдвигаем родителя вниз
      index = parent;
    }
    items[index] = item;
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
