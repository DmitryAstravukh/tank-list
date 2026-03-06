import { describe, it, expect } from "vitest";
import { getRange } from "./index";

describe("getRange", () => {
  it("генерирует последовательность от from до to включительно", () => {
    expect(getRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("генерирует последовательность из двух элементов", () => {
    expect(getRange(1, 2)).toEqual([1, 2]);
  });

  it("возвращает массив из одного элемента, когда from === to", () => {
    expect(getRange(3, 3)).toEqual([3]);
  });

  it("возвращает [0], когда from и to равны нулю", () => {
    expect(getRange(0, 0)).toEqual([0]);
  });

  it("корректно работает с диапазоном от нуля", () => {
    expect(getRange(0, 4)).toEqual([0, 1, 2, 3, 4]);
  });

  it("генерирует последовательность отрицательных чисел", () => {
    expect(getRange(-3, -1)).toEqual([-3, -2, -1]);
  });

  it("генерирует последовательность, пересекающую ноль", () => {
    expect(getRange(-2, 2)).toEqual([-2, -1, 0, 1, 2]);
  });

  it("возвращает массив правильной длины", () => {
    expect(getRange(1, 100)).toHaveLength(100);
  });

  it("первый элемент равен from, последний — to", () => {
    const result = getRange(5, 15);

    expect(result[0]).toBe(5);
    expect(result[result.length - 1]).toBe(15);
  });

  it("все элементы массива являются числами", () => {
    const result = getRange(1, 10);

    result.forEach((item) => {
      expect(typeof item).toBe("number");
    });
  });

  it("каждый следующий элемент больше предыдущего на 1", () => {
    const result = getRange(10, 20);

    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBe((result[i - 1] as number) + 1);
    }
  });

  it("возвращает пустой массив, когда from > to", () => {
    expect(getRange(5, 3)).toEqual([]);
  });

  it("возвращает пустой массив, когда from на 1 больше to", () => {
    expect(getRange(4, 3)).toEqual([]);
  });

  it("корректно генерирует большой диапазон", () => {
    const result = getRange(1, 10_000);

    expect(result).toHaveLength(10_000);
    expect(result[0]).toBe(1);
    expect(result[9_999]).toBe(10_000);
  });
});
