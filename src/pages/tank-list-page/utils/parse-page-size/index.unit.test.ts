import { parsePageSize } from ".";
import { PAGINATION_PAGE_SIZES } from "../../constants";
import { PaginationPageSize } from "./../../types/index";
import { describe, it, expect } from "vitest";

describe("parsePageSize", () => {
  const fallback: PaginationPageSize = 10;

  it("возвращает fallback, если value = null", () => {
    expect(parsePageSize(null, fallback)).toBe(fallback);
  });

  it("возвращает валидное значение, если оно присутствует в PAGINATION_PAGE_SIZES", () => {
    for (const size of PAGINATION_PAGE_SIZES) {
      expect(parsePageSize(String(size), fallback)).toBe(size);
    }
  });

  it("возвращает fallback, если значение не входит в список допустимых", () => {
    expect(parsePageSize("777", fallback)).toBe(fallback);
    expect(parsePageSize("-1", fallback)).toBe(fallback);
    expect(parsePageSize("0", fallback)).toBe(fallback);
  });

  it("возвращает fallback для нечисловых значений", () => {
    expect(parsePageSize("abc", fallback)).toBe(fallback);
    expect(parsePageSize("", fallback)).toBe(fallback);
    expect(parsePageSize("   ", fallback)).toBe(fallback); // Number("   ") -> 0, обычно невалидно
  });

  it("корректно обрабатывает дробные значения (обычно невалидны)", () => {
    // Number("10.5") -> 10.5, и includes(10.5) обычно false
    expect(parsePageSize("10.5", fallback)).toBe(fallback);
  });

  it("корректно обрабатывает NaN/Infinity как невалидные", () => {
    expect(parsePageSize("NaN", fallback)).toBe(fallback);
    expect(parsePageSize("Infinity", fallback)).toBe(fallback);
    expect(parsePageSize("-Infinity", fallback)).toBe(fallback);
  });

  it("принимает строку с ведущими/замыкающими пробелами для валидных значений", () => {
    // Number(" 20 ") -> 20
    // Если 20 действительно разрешён, вернёт 20, иначе fallback.
    const candidate = 20 as PaginationPageSize;

    if ((PAGINATION_PAGE_SIZES as readonly number[]).includes(20)) {
      expect(parsePageSize(" 20 ", fallback)).toBe(candidate);
    } else {
      expect(parsePageSize(" 20 ", fallback)).toBe(fallback);
    }
  });
});
