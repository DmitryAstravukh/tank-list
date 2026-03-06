import type { RequestedTank } from "../../types";

/**
 * Удаляет дубликаты танков по tank_id, сохраняя порядок первого появления.
 *
 * Правила:
 * - Если в массиве несколько объектов с одинаковым tank_id, в результате остаётся только первый.
 * - Порядок элементов в результате соответствует порядку первого появления в исходном массиве.
 * - Функция не изменяет исходный массив.
 *
 * Важно: уникальность определяется только по полю tank_id, остальные поля не учитываются.
 *
 * @param items - Список танков (возможны повторы по tank_id).
 * @returns Новый массив без повторов по tank_id, в исходном порядке.
 *
 * @example
 * const a = { tank_id: 1, name: "A" } as RequestedTank;
 * const b = { tank_id: 2, name: "B" } as RequestedTank;
 * const a2 = { tank_id: 1, name: "A v2" } as RequestedTank;
 *
 * dedupeByTankIdKeepOrder([a, b, a2]); // [a, b]
 */
export const dedupeByTankIdKeepOrder = (items: RequestedTank[]): RequestedTank[] => {
  const seen = new Set<number>();
  const out: RequestedTank[] = [];
  for (const t of items) {
    if (seen.has(t.tank_id)) continue;
    seen.add(t.tank_id);
    out.push(t);
  }
  return out;
};
