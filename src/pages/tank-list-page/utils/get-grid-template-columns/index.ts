import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import { TABLE_COLUMN_CONFIG } from "../../constants";

/**
 * Формирует значение CSS-свойства grid-template-columns
 * на основе ширин колонок из {@link TABLE_COLUMN_CONFIG},
 * соблюдая порядок полей из {@link TANK_REQUEST_FIELDS}.
 *
 * @returns {string} Строка вида "86px minmax(240px, 1.8fr) 92px ...",
 *   пригодная для использования в grid-template-columns.
 *
 * @example
 * // При TANK_REQUEST_FIELDS = ["tank_id", "name", "tier", ...]
 * getGridTemplateColumns();
 * // => "86px minmax(240px, 1.8fr) 92px 130px 130px 122px 170px 220px"
 */
export const getGridTemplateColumns = () => {
  return TANK_REQUEST_FIELDS.map((field) => TABLE_COLUMN_CONFIG[field].width).join(" ");
};
