import { describe, it, expect } from "vitest";
import { getTotalPages } from "./index";

describe("getTotalPages", () => {
  it("возвращает точное число страниц, когда элементы делятся без остатка", () => {
    expect(getTotalPages(100, 10)).toBe(10);
  });

  it("возвращает 1 страницу, когда totalItems === pageSize", () => {
    expect(getTotalPages(10, 10)).toBe(1);
  });

  it("округляет вверх, когда есть остаток", () => {
    expect(getTotalPages(101, 10)).toBe(11);
  });

  it("округляет вверх при минимальном остатке (1 лишний элемент)", () => {
    expect(getTotalPages(11, 10)).toBe(2);
  });

  it("возвращает 0, когда нет элементов", () => {
    expect(getTotalPages(0, 10)).toBe(0);
  });

  it("возвращает 1 страницу, когда элементов меньше pageSize", () => {
    expect(getTotalPages(3, 10)).toBe(1);
  });

  it("возвращает 1 страницу для одного элемента", () => {
    expect(getTotalPages(1, 10)).toBe(1);
  });

  it("при pageSize = 1 количество страниц равно количеству элементов", () => {
    expect(getTotalPages(42, 1)).toBe(42);
  });

  it("корректно работает с большими числами", () => {
    expect(getTotalPages(1_000_000, 7)).toBe(142858);
  });

  it("возвращает 1, когда pageSize значительно больше totalItems", () => {
    expect(getTotalPages(1, 1000)).toBe(1);
  });
});
