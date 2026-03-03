import { TANK_FIELD_LABELS } from "@/entities/tank/constants";
import type { TankField } from "@/entities/tank/types";

/**
 * Генератор конфигурации колонок таблицы.
 * Преобразует массив полей в массив объектов `{ key, label }` для UI-таблицы.
 *
 * @template {readonly TankField[]} F — кортеж имён полей танка
 * @param {F} fields — массив полей, для которых нужны колонки
 * @returns {Array<{ key: F[number], label: string }>} конфигурация колонок
 *
 * @example
 * const columns = getTableColumns(TANK_REQUEST_FIELDS);
 * // [{ key: "tank_id", label: "ID" }, { key: "name", label: "Название" }, ...]
 *
 * @see {@link TANK_FIELD_LABELS} — источник лейблов для колонок
 * @see {@link TANK_REQUEST_FIELDS} — типичный аргумент
 */
export const getTableColumns = <const F extends readonly TankField[]>(fields: F) => {
  return fields.map((field) => ({
    key: field,
    label: TANK_FIELD_LABELS[field],
  }));
};
