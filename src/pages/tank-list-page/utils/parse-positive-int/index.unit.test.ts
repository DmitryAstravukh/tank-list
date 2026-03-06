import { describe, it, expect } from "vitest";
import { parsePositiveInt } from "./index";

describe("parsePositiveInt", () => {
  it("возвращает fallback, если value = null", () => {
    expect(parsePositiveInt(null, 1)).toBe(1);
  });

  it("возвращает число, если value — корректное положительное целое", () => {
    expect(parsePositiveInt("1", 999)).toBe(1);
    expect(parsePositiveInt("10", 999)).toBe(10);
    expect(parsePositiveInt("999", 1)).toBe(999);
  });

  it("округляет дробные значения вниз", () => {
    expect(parsePositiveInt("1.1", 1)).toBe(1);
    expect(parsePositiveInt("5.9", 1)).toBe(5);
    expect(parsePositiveInt("10.0", 1)).toBe(10);
  });

  it("возвращает fallback для нуля и отрицательных чисел", () => {
    expect(parsePositiveInt("0", 1)).toBe(1);
    expect(parsePositiveInt("-1", 1)).toBe(1);
    expect(parsePositiveInt("-999", 1)).toBe(1);
  });

  it("возвращает fallback для нечисловых строк", () => {
    expect(parsePositiveInt("abc", 1)).toBe(1);
    expect(parsePositiveInt("", 1)).toBe(1);
    expect(parsePositiveInt("   ", 1)).toBe(1); // Number("   ") -> 0
  });

  it("возвращает fallback для NaN/Infinity", () => {
    expect(parsePositiveInt("NaN", 1)).toBe(1);
    expect(parsePositiveInt("Infinity", 1)).toBe(1);
    expect(parsePositiveInt("-Infinity", 1)).toBe(1);
  });

  it("принимает строку с пробелами вокруг числа", () => {
    expect(parsePositiveInt("  7  ", 1)).toBe(7);
  });

  it("корректно работает с другим fallback", () => {
    expect(parsePositiveInt(null, 42)).toBe(42);
    expect(parsePositiveInt("0", 42)).toBe(42);
    expect(parsePositiveInt("100", 42)).toBe(100);
  });
});
