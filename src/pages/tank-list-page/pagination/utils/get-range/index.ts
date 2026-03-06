/**
 * Генерирует массив последовательных чисел от from до to включительно.
 *
 * @param from — начальное значение диапазона (включительно)
 * @param to — конечное значение диапазона (включительно)
 * @returns массив чисел `[from, from+1, ..., to]`
 *
 * @example
 * range(1, 5);  // → [1, 2, 3, 4, 5]
 * range(3, 3);  // → [3]
 * range(0, 0);  // → [0]
 */
export const getRange = (from: number, to: number): number[] => {
  const length = to - from + 1;
  return Array.from({ length }, (_, idx) => idx + from);
};
