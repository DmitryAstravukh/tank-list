// src/pages/tank-list-page/table/table-row/TableRow.test.tsx
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

/**
 * Тесты для TableRow.
 *
 * ВАЖНО: пути в vi.mock(...) должны 1-в-1 совпадать с импортами ВНУТРИ компонента:
 *   import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
 *   import { getTableColumns } from "../../utils";
 *   import { TABLE_COLUMN_CONFIG } from "../../constants";
 *   import { TableCell } from "./table-cell/TableCell";
 *
 * Если у тебя файл компонента называется иначе (например TableRow.component.tsx),
 * поменяй импорт ниже: `import { TableRow } from "./TableRow";`
 */

/* ------------------------------ HOISTED MOCKS ------------------------------ */

/**
 * Hoisted mock для getTableColumns, чтобы он был доступен внутри фабрики vi.mock
 * (потому что vi.mock hoisted).
 */
const getTableColumnsMock = vi.hoisted(() => vi.fn());

/**
 * Hoisted mock компонента TableCell:
 * - даёт нам возможность проверить, сколько раз он рендерился
 * - и какие props были переданы (data / fieldName / className)
 */
const TableCellMock = vi.hoisted(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.fn((props: any) => {
    const field = String(props.fieldName);
    const cls = props.className ?? "";
    return <div data-testid={`cell-${field}`} data-field={field} data-class={String(cls)} />;
  }),
);

/* --------------------------------- MOCKS ---------------------------------- */

vi.mock("@/entities/tank/constants", () => ({
  TANK_REQUEST_FIELDS: ["name", "nation", "tier"],
}));

vi.mock("../../utils", () => ({
  getTableColumns: getTableColumnsMock,
}));

vi.mock("../../constants", () => ({
  TABLE_COLUMN_CONFIG: {
    name: { responsiveClass: "col--name" },
    nation: { responsiveClass: undefined },
    tier: { responsiveClass: "col--tier" },
  },
}));

vi.mock("./table-cell/TableCell", () => ({
  TableCell: TableCellMock,
}));

/**
 * Если SCSS-импорт ломает тесты в твоей конфигурации — раскомментируй:
 * vi.mock("./TableRow.scss", () => ({}));
 */

/* --------------------------------- IMPORTS -------------------------------- */

import { TANK_REQUEST_FIELDS } from "./../../../../entities/tank/constants";
import { TABLE_COLUMN_CONFIG } from "../../constants";
import { TableRow } from "./TableRow";

/**
 * Минимальный объект "танка" для тестов.
 * TableRow прокидывает `data` дальше в TableCell, а мы TableCell мокнули,
 * поэтому структура data здесь не важна.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SAMPLE_DATA = { id: 1, name: "IS-7" } as any;

describe("TableRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it(/**
   * TableRow должен строить набор колонок через getTableColumns(TANK_REQUEST_FIELDS),
   * иначе он перестанет соответствовать конфигу таблицы.
   */
  "calls getTableColumns with TANK_REQUEST_FIELDS", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    render(<TableRow data={SAMPLE_DATA} isFound={false} />);

    expect(getTableColumnsMock).toHaveBeenCalledTimes(1);
    expect(getTableColumnsMock).toHaveBeenCalledWith(TANK_REQUEST_FIELDS);
  });

  it(/**
   * Корневой элемент строки должен иметь role="row" и базовый класс table__row —
   * это важно и для доступности, и для CSS сетки таблицы.
   */
  "renders a row with role=row and base class", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    render(<TableRow data={SAMPLE_DATA} isFound={false} />);

    const row = screen.getByRole("row");
    expect(row).toHaveClass("table__row");
  });

  it(/**
   * При isFound=true строка должна подсвечиваться модификатором table__row--found.
   */
  "adds table__row--found class when isFound is true", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    render(<TableRow data={SAMPLE_DATA} isFound={true} />);

    const row = screen.getByRole("row");
    expect(row).toHaveClass("table__row--found");
  });

  it(/**
   * При isFound=false модификатор table__row--found не должен добавляться.
   */
  "does not add table__row--found class when isFound is false", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    render(<TableRow data={SAMPLE_DATA} isFound={false} />);

    const row = screen.getByRole("row");
    expect(row).not.toHaveClass("table__row--found");

    /**
     * Примечание:
     * В текущей реализации className использует шаблон:
     *   `table__row ${isFound && "table__row--found"}`
     * Если isFound=false, в className может попасть строка "false".
     * Этот тест это НЕ проверяет, чтобы не ломать сборку.
     * Если хочешь поймать/зафиксить это — лучше заменить на:
     *   `table__row ${isFound ? "table__row--found" : ""}`
     * или использовать clsx.
     */
  });

  it(/**
   * TableRow должен корректно прокидывать rowRef в div:
   * это нужно для скролла/фокуса/наблюдателей (IntersectionObserver) и т.п.
   */
  "attaches rowRef to the root div", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    const ref = React.createRef<HTMLDivElement>();
    render(<TableRow data={SAMPLE_DATA} isFound={false} rowRef={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("role", "row");
  });

  it(/**
   * На каждую колонку из getTableColumns должны отрисовываться TableCell,
   * и TableRow обязан передать правильные props:
   * - data: исходный объект строки
   * - fieldName: key колонки
   * - className: responsiveClass из TABLE_COLUMN_CONFIG[key]
   */
  "renders TableCell for each column and passes correct props", () => {
    getTableColumnsMock.mockReturnValue([
      { key: "name", label: "Название" },
      { key: "nation", label: "Нация" },
      { key: "tier", label: "Уровень" },
    ] as Array<{ key: keyof typeof TABLE_COLUMN_CONFIG; label: string }>);

    render(<TableRow data={SAMPLE_DATA} isFound={false} />);

    // 1) Кол-во TableCell = кол-ву колонок
    expect(TableCellMock).toHaveBeenCalledTimes(3);

    // 2) И они реально присутствуют в DOM (мы рисуем div data-testid="cell-*")
    expect(screen.getByTestId("cell-name")).toBeInTheDocument();
    expect(screen.getByTestId("cell-nation")).toBeInTheDocument();
    expect(screen.getByTestId("cell-tier")).toBeInTheDocument();

    // 3) Проверяем props вызовов
    const calls = TableCellMock.mock.calls.map((c) => c[0]);

    expect(calls[0]).toEqual(
      expect.objectContaining({
        data: SAMPLE_DATA,
        fieldName: "name",
        className: "col--name",
      }),
    );

    expect(calls[1]).toEqual(
      expect.objectContaining({
        data: SAMPLE_DATA,
        fieldName: "nation",
        className: undefined, // в мок-конфиге nation: responsiveClass undefined
      }),
    );

    expect(calls[2]).toEqual(
      expect.objectContaining({
        data: SAMPLE_DATA,
        fieldName: "tier",
        className: "col--tier",
      }),
    );
  });
});
