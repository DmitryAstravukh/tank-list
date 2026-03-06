import { useEffect, useRef, type CSSProperties } from "react";
import { getGridTemplateColumns } from "../utils/get-grid-template-columns";
import "./Table.scss";
import { TableHeader } from "./table-header/TableHeader";
import type { RequestedTank } from "../types";
import { TableRow } from "./table-row/TableRow";

type TableProps = {
  rows: RequestedTank[];
  foundTankId: number | null;
};

/**
 * Table — компонент таблицы списка танков.
 *
 * Основные задачи:
 * 1) Настраивает CSS-переменную --tank-grid-columns, чтобы управлять сеткой колонок таблицы
 *    (значение берётся из getGridTemplateColumns()).
 * 2) Рендерит заголовок таблицы {@link TableHeader}.
 * 3) Рендерит группу строк (role="rowgroup") и для каждой записи из rows создаёт {@link TableRow}.
 * 4) Если передан foundTankId и соответствующая строка существует, автоматически
 *    скроллит её в область видимости (scrollIntoView) с плавной прокруткой и выравниванием по центру.
 *
 * Доступность (a11y):
 * - Корневой контейнер имеет role="table".
 * - Контейнер строк имеет role="rowgroup".
 *
 * @param {TableProps} props Пропсы компонента.
 * @param {RequestedTank[]} props.rows Массив строк таблицы (данные танков).
 * @param {number | null} props.foundTankId Идентификатор найденного танка; при совпадении строка подсвечивается
 * и скроллится в видимую область. null — ничего не искать/не скроллить.
 * @returns {JSX.Element} React-элемент таблицы.
 */
export const Table = ({ rows, foundTankId }: TableProps) => {
  const tableStyle = { "--tank-grid-columns": getGridTemplateColumns() } as CSSProperties;

  const foundRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!foundTankId) return;
    if (!foundRowRef.current) return;

    foundRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [foundTankId, rows]);

  return (
    <div className="table" role="table" style={tableStyle}>
      <TableHeader />

      <div role="rowgroup">
        {rows.map((t) => (
          <TableRow
            key={t.tank_id}
            data={t}
            isFound={foundTankId === t.tank_id}
            rowRef={foundTankId === t.tank_id ? foundRowRef : undefined}
          />
        ))}
      </div>
    </div>
  );
};
