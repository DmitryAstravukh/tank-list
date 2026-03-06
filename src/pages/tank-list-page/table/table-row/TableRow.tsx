import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import type { RequestedTank } from "../../types";
import { getTableColumns } from "../../utils";
import "./TableRow.scss";
import { TableCell } from "./table-cell/TableCell";
import { TABLE_COLUMN_CONFIG } from "../../constants";

type TableRow = {
  data: RequestedTank;
  isFound: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
};

/**
 * TableRow — строка таблицы со значениями по колонкам.
 *
 * Как работает:
 * 1) Получает набор колонок через getTableColumns(TANK_REQUEST_FIELDS).
 * 2) Рендерит контейнер строки div с role="row".
 * 3) Для каждой колонки рендерит {@link TableCell}, пробрасывая:
 *    - data (все данные строки)
 *    - fieldName (ключ колонки)
 *    - className (адаптивный класс из TABLE_COLUMN_CONFIG[key].responsiveClass)
 *
 * CSS-классы:
 * - Базовый класс строки: "table__row".
 * - При isFound=true добавляется модификатор "table__row--found" (подсветка строки).
 *
 * Доступность (a11y):
 * - Используется role="row" для корректной семантики строк табличной разметки.
 *
 * @param {TableRowProps} props Пропсы компонента.
 * @param {RequestedTank} props.data Данные строки таблицы.
 * @param {boolean} props.isFound Нужно ли подсветить строку как “найденную”.
 * @param {React.Ref<HTMLDivElement>} [props.rowRef] Ref на корневой элемент строки.
 * @returns {JSX.Element} React-элемент строки таблицы.
 */
export const TableRow = ({ data, isFound, rowRef }: TableRow) => {
  const columns = getTableColumns(TANK_REQUEST_FIELDS);

  return (
    <div ref={rowRef} className={`table__row ${isFound && "table__row--found"}`} role="row">
      {columns.map(({ key }) => (
        <TableCell
          key={key}
          data={data}
          fieldName={key}
          className={TABLE_COLUMN_CONFIG[key].responsiveClass}
        />
      ))}
    </div>
  );
};
