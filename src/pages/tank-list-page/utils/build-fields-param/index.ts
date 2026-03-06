import type { TankField } from "@/entities/tank/types";

/**
 * Сериализатор полей в query-параметр.
 * Склеивает массив имён полей через запятую для URL-параметра fields=.
 *
 * @template {readonly TankField[]} F — кортеж имён полей танка
 * @param {F} fields — массив полей для сериализации
 * @returns {string} строка вида "tank_id,name,tier" для HTTP-запроса
 *
 * @example
 * const param = buildFieldsParam(["tank_id", "name", "tier"] as const);
 * // "tank_id,name,tier"
 *
 * @see {@link TANK_REQUEST_FIELDS} — типичный аргумент
 */
export const buildFieldsParam = <const F extends readonly TankField[]>(fields: F) => {
  return fields.join(",");
};
