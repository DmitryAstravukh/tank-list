import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TableCell } from "./TableCell";

// Мокаем scss, чтобы тесты не падали из-за импорта стилей
vi.mock("./TableCell.scss", () => ({}));

describe("TableCell", () => {
  it('рендерит premium-имя: fieldName="name" + is_premium=true', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      name: "Tiger",
      is_premium: true,
      price_credit: 12345,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"name" as any} className="extra" />);

    const cell = screen.getByText("Tiger");
    expect(cell).toBeInTheDocument();

    expect(cell).toHaveClass("table__cell");
    expect(cell).toHaveClass("table__cell--premium");
    expect(cell).toHaveClass("extra");

    // title должен быть строкой значения
    expect(cell).toHaveAttribute("title", "Tiger");
  });

  it('рендерит обычное имя: fieldName="name" + is_premium=false (без premium-класса)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      name: "Sherman",
      is_premium: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"name" as any} />);

    const cell = screen.getByText("Sherman");
    expect(cell).toHaveClass("table__cell");
    expect(cell).not.toHaveClass("table__cell--premium");
    expect(cell).toHaveAttribute("title", "Sherman");

    // защита от "undefined" в className при отсутствии className пропса
    expect(cell.className).not.toContain("undefined");
  });

  it('рендерит is_premium=true как "Да" и проставляет title="true"', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { is_premium: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"is_premium" as any} className="x" />);

    const cell = screen.getByText("Да");
    expect(cell).toHaveClass("table__cell");
    expect(cell).toHaveClass("x");
    expect(cell).toHaveAttribute("title", "true");
  });

  it('рендерит is_premium=false как "Нет" и проставляет title="false"', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { is_premium: false };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"is_premium" as any} />);

    const cell = screen.getByText("Нет");
    expect(cell).toHaveClass("table__cell");
    expect(cell).toHaveAttribute("title", "false");
  });

  it('рендерит price_credit=null как "—" (без title)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { price_credit: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"price_credit" as any} className="extra" />);

    const cell = screen.getByText("—");
    expect(cell).toHaveClass("table__cell");
    expect(cell).toHaveClass("extra");
    expect(cell).not.toHaveClass("table__cell--numeric");
    expect(cell).not.toHaveAttribute("title");
  });

  it("рендерит price_credit числом: форматирует ru-RU, добавляет numeric-класс и title", () => {
    const value = 1000000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { price_credit: value };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"price_credit" as any} />);

    const cell = screen.getByTitle(String(value));

    expect(cell).toHaveClass("table__cell", "table__cell--numeric");

    const normalizeSpaces = (s: string) => s.replace(/[\u00A0\u202F]/g, " ");
    expect(normalizeSpaces(cell.textContent ?? "")).toBe("1 000 000");
  });

  it("для прочих полей выводит String(value) и ставит title", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { tier: 8 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<TableCell data={data} fieldName={"tier" as any} />);

    const cell = screen.getByText("8");
    expect(cell).toHaveClass("table__cell");
    expect(cell).toHaveAttribute("title", "8");
  });
});
