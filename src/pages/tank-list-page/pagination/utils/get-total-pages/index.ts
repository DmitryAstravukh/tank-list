/**
 * Вычисляет общее количество страниц для пагинации.
 *
 * @param totalItems — общее количество элементов
 * @param pageSize — количество элементов на одной странице
 * @returns количество страниц (округлённое вверх)
 *
 * @example
 * getTotalPages(100, 10); // → 10
 * getTotalPages(101, 10); // → 11
 * getTotalPages(0, 10);   // → 0
 */
export const getTotalPages = (totalItems: number, pageSize: number) =>
  Math.ceil(totalItems / pageSize);
