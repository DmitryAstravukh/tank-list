import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const getGridTemplateColumnsMock = vi.hoisted(() => vi.fn(() => "120px 1fr 80px"));

const TableHeaderMock = vi.hoisted(() => vi.fn(() => <div data-testid="table-header" />));

const TableRowMock = vi.hoisted(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.fn((props: any) => {
    const id = props?.data?.tank_id;
    return (
      <div
        role="row"
        ref={props.rowRef}
        data-testid={`row-${id}`}
        data-found={props.isFound ? "1" : "0"}
      />
    );
  }),
);

vi.mock("../utils/get-grid-template-columns", () => ({
  getGridTemplateColumns: getGridTemplateColumnsMock,
}));

vi.mock("./table-header/TableHeader", () => ({
  TableHeader: TableHeaderMock,
}));

vi.mock("./table-row/TableRow", () => ({
  TableRow: TableRowMock,
}));

import { Table } from "./Table";

describe("Table", () => {
  /**
   * scrollIntoView в JSDOM обычно отсутствует.
   * Мы добавляем его на prototype, чтобы:
   * - не падать в рантайме
   * - уметь проверять факт вызова и аргументы
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalScrollIntoView: any;
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalScrollIntoView = (HTMLElement.prototype as any).scrollIntoView;

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: scrollIntoViewMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();

    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: originalScrollIntoView,
      writable: true,
      configurable: true,
    });
  });

  it(/**
   * Table должен выставлять CSS custom property `--tank-grid-columns`,
   * используя результат getGridTemplateColumns().
   * Это важно: таблица визуально зависит от этой переменной.
   */
  "sets --tank-grid-columns style from getGridTemplateColumns()", () => {
    getGridTemplateColumnsMock.mockReturnValue("10px 20px 30px");

    render(<Table rows={[]} foundTankId={null} />);

    const table = screen.getByRole("table");
    expect(table).toHaveClass("table");
    expect(table.style.getPropertyValue("--tank-grid-columns")).toBe("10px 20px 30px");
  });

  it(/**
   * Table обязан отрисовать TableHeader и rowgroup.
   */
  "renders TableHeader and rowgroup", () => {
    render(<Table rows={[]} foundTankId={null} />);

    expect(screen.getByTestId("table-header")).toBeInTheDocument();
    expect(screen.getByRole("rowgroup")).toBeInTheDocument();
  });

  it(/**
   * Table должен рендерить TableRow для каждого элемента rows
   * и правильно выставлять isFound/rowRef в зависимости от foundTankId.
   */
  "renders one TableRow per row and passes isFound/rowRef correctly", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = [{ tank_id: 1 }, { tank_id: 2 }, { tank_id: 3 }] as any[];

    render(<Table rows={rows} foundTankId={2} />);

    // 1) TableRow вызван по количеству rows
    expect(TableRowMock).toHaveBeenCalledTimes(3);

    // 2) В DOM есть маркеры строк
    expect(screen.getByTestId("row-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-2")).toBeInTheDocument();
    expect(screen.getByTestId("row-3")).toBeInTheDocument();

    // 3) Проверяем props вызовов
    const calls = TableRowMock.mock.calls.map((c) => c[0]);

    expect(calls[0]).toEqual(
      expect.objectContaining({
        data: rows[0],
        isFound: false,
        rowRef: undefined,
      }),
    );

    expect(calls[1]).toEqual(
      expect.objectContaining({
        data: rows[1],
        isFound: true,
      }),
    );
    // rowRef на найденной строке должен быть передан (не undefined)
    expect(calls[1].rowRef).toBeDefined();

    expect(calls[2]).toEqual(
      expect.objectContaining({
        data: rows[2],
        isFound: false,
        rowRef: undefined,
      }),
    );

    // 4) Плюс можно проверить "маркер" data-found
    expect(screen.getByTestId("row-2")).toHaveAttribute("data-found", "1");
    expect(screen.getByTestId("row-1")).toHaveAttribute("data-found", "0");
    expect(screen.getByTestId("row-3")).toHaveAttribute("data-found", "0");
  });

  it(/**
   * Если foundTankId задан и строка существует, Table должен вызвать scrollIntoView
   * на найденной строке с { behavior: "smooth", block: "center" }.
   */
  "scrolls found row into view when foundTankId is provided", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = [{ tank_id: 10 }, { tank_id: 20 }] as any[];

    render(<Table rows={rows} foundTankId={20} />);

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    });

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it(/**
   * Если foundTankId = null, эффекты должны завершиться раньше и скролла быть не должно.
   */
  "does not scroll when foundTankId is null", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = [{ tank_id: 10 }, { tank_id: 20 }] as any[];

    render(<Table rows={rows} foundTankId={null} />);

    // Даём шанс эффектам отработать (хотя тут они должны сразу выйти).
    await Promise.resolve();

    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it(/**
   * useEffect зависит от [foundTankId, rows],
   * значит при изменении rows (даже при том же foundTankId) эффект должен запускаться снова
   * и скроллить повторно (если ref всё ещё указывает на найденную строку).
   */
  "scrolls again when rows change (effect dependency includes rows)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows1 = [{ tank_id: 1 }, { tank_id: 2 }] as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows2 = [{ tank_id: 1 }, { tank_id: 2 }, { tank_id: 3 }] as any[];

    const view = render(<Table rows={rows1} foundTankId={2} />);

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    });

    view.rerender(<Table rows={rows2} foundTankId={2} />);

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    });
  });
});
