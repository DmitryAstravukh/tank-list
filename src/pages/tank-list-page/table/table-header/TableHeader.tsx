import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import { getTableColumns } from "../../utils";
import { TABLE_COLUMN_CONFIG } from "../../constants";

/**
 * TableHeader — строка заголовков таблицы.
 *
 * Строит набор колонок через getTableColumns(TANK_REQUEST_FIELDS) и рендерит:
 * - контейнер-строку с role="row"
 * - для каждой колонки span с role="columnheader"
 *
 * CSS-классы:
 * - базовый класс ячейки: "table__head-cell"
 * - дополнительный responsive-класс берется из TABLE_COLUMN_CONFIG[key].responsiveClass (если задан).
 *
 * @returns React-элемент строки заголовка таблицы.
 */
export const TableHeader = () => {
  const columns = getTableColumns(TANK_REQUEST_FIELDS);

  return (
    <div className="table__row table__row--head" role="row">
      {columns.map(({ key, label }) => (
        <span
          key={key}
          className={`table__head-cell ${TABLE_COLUMN_CONFIG[key].responsiveClass ?? ""}`}
          role="columnheader"
        >
          {label}
        </span>
      ))}
    </div>
  );
};
