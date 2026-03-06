import { describe, it, expect } from "vitest";
import { clamp } from "./index";

describe("clamp", () => {
  it("возвращает n, если n находится в пределах [min, max]", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(1, 1, 10)).toBe(1); // нижняя граница включительно
    expect(clamp(10, 1, 10)).toBe(10); // верхняя граница включительно
  });

  it("возвращает min, если n меньше min", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(0, 1, 10)).toBe(1);
  });

  it("возвращает max, если n больше max", () => {
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(999, 0, 10)).toBe(10);
  });

  it("корректно работает с отрицательными диапазонами", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-999, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });

  it("корректно работает, когда min === max", () => {
    expect(clamp(-100, 3, 3)).toBe(3);
    expect(clamp(3, 3, 3)).toBe(3);
    expect(clamp(100, 3, 3)).toBe(3);
  });

  it("корректно работает с дробными числами", () => {
    expect(clamp(1.5, 1, 2)).toBe(1.5);
    expect(clamp(0.5, 1, 2)).toBe(1);
    expect(clamp(2.5, 1, 2)).toBe(2);
  });

  it("передаёт NaN как есть (текущее поведение)", () => {
    // Math.max(min, NaN) => NaN; Math.min(max, NaN) => NaN
    expect(Number.isNaN(clamp(Number.NaN, 0, 10))).toBe(true);
  });

  it("корректно обрабатывает Infinity", () => {
    expect(clamp(Number.POSITIVE_INFINITY, 0, 10)).toBe(10);
    expect(clamp(Number.NEGATIVE_INFINITY, 0, 10)).toBe(0);
  });

  it("имеет неочевидное поведение при min > max (задокументировано)", () => {
    // clamp(5, 10, 1):
    // Math.max(10, 5) = 10
    // Math.min(1, 10) = 1
    expect(clamp(5, 10, 1)).toBe(1);
  });
});
