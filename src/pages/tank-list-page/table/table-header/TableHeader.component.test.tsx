// src/pages/tank-list-page/table/table-header/TableHeader.component.test.tsx
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

/** Hoisted mock для getTableColumns (чтобы был доступен внутри vi.mock factory). */
const getTableColumnsMock = vi.hoisted(() => vi.fn());

vi.mock("../../utils", () => ({
  getTableColumns: getTableColumnsMock,
}));

vi.mock("@/entities/tank/constants", () => ({
  TANK_REQUEST_FIELDS: ["name", "nation", "tier"],
}));

vi.mock("../../constants", () => ({
  TABLE_COLUMN_CONFIG: {
    name: { responsiveClass: "col--name" },
    nation: { responsiveClass: undefined }, // проверим, что "undefined" не попадёт в className
    tier: { responsiveClass: "col--tier" },
  },
}));

import { TableHeader } from "./TableHeader";
import { TANK_REQUEST_FIELDS } from "./../../../../entities/tank/constants";
import { TABLE_COLUMN_CONFIG } from "../../constants";

describe("TableHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it(/**
   * Компонент обязан строить колонки через getTableColumns(TANK_REQUEST_FIELDS),
   * иначе заголовок перестанет соответствовать конфигурации таблицы.
   */
  "calls getTableColumns with TANK_REQUEST_FIELDS", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    render(<TableHeader />);

    expect(getTableColumnsMock).toHaveBeenCalledTimes(1);
    expect(getTableColumnsMock).toHaveBeenCalledWith(TANK_REQUEST_FIELDS);
  });

  it(/**
   * Корневой элемент должен быть "строкой" заголовка таблицы:
   * - role="row" для доступности
   * - классы для стилизации
   */
  "renders header row with role=row and head classes", () => {
    getTableColumnsMock.mockReturnValue([{ key: "name", label: "Название" }]);

    render(<TableHeader />);

    const row = screen.getByRole("row");
    expect(row).toHaveClass("table__row");
    expect(row).toHaveClass("table__row--head");
  });

  it(/**
   * Компонент должен отрисовать span[role="columnheader"] на каждую колонку,
   * в том же порядке и с теми же label, что вернул getTableColumns().
   */
  "renders a columnheader for each column in the same order", () => {
    getTableColumnsMock.mockReturnValue([
      { key: "name", label: "Название" },
      { key: "nation", label: "Нация" },
      { key: "tier", label: "Уровень" },
    ]);

    render(<TableHeader />);

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);

    expect(headers[0]).toHaveTextContent("Название");
    expect(headers[1]).toHaveTextContent("Нация");
    expect(headers[2]).toHaveTextContent("Уровень");
  });

  it(/**
   * Каждая ячейка заголовка должна:
   * - иметь базовый класс "table__head-cell"
   * - добавлять responsiveClass из TABLE_COLUMN_CONFIG[key], если он задан
   */
  "applies base class and responsiveClass from TABLE_COLUMN_CONFIG", () => {
    getTableColumnsMock.mockReturnValue([
      { key: "name", label: "Название" },
      { key: "tier", label: "Уровень" },
    ] as Array<{ key: keyof typeof TABLE_COLUMN_CONFIG; label: string }>);

    render(<TableHeader />);

    const nameHeader = screen.getByRole("columnheader", { name: "Название" });
    expect(nameHeader).toHaveClass("table__head-cell");
    expect(nameHeader).toHaveClass("col--name");

    const tierHeader = screen.getByRole("columnheader", { name: "Уровень" });
    expect(tierHeader).toHaveClass("table__head-cell");
    expect(tierHeader).toHaveClass("col--tier");
  });

  it(/**
   * Если responsiveClass отсутствует (undefined/null),
   * в итоговом className не должны появляться строки "undefined"/"null".
   * Иначе ломается верстка и усложняется отладка.
   */
  'does not leak "undefined"/"null" into className when responsiveClass is missing', () => {
    getTableColumnsMock.mockReturnValue([{ key: "nation", label: "Нация" }] as Array<{
      key: keyof typeof TABLE_COLUMN_CONFIG;
      label: string;
    }>);

    render(<TableHeader />);

    const nationHeader = screen.getByRole("columnheader", { name: "Нация" });
    expect(nationHeader).toHaveClass("table__head-cell");
    expect(nationHeader.className).not.toMatch(/undefined|null/);
  });
});
