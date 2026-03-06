import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePagination } from "./use-pagination";

const pagination = (overrides: {
  currentPage: number;
  totalItems?: number;
  pageSize?: number;
  siblingsCount?: number;
}) => {
  const { result } = renderHook(() =>
    usePagination({
      totalItems: 100,
      pageSize: 10,
      ...overrides,
    }),
  );
  return result.current;
};

describe("все страницы без многоточий (totalPageNumbers >= totalPages)", () => {
  it("возвращает все страницы, когда их меньше порога (3 страницы)", () => {
    expect(pagination({ currentPage: 1, totalItems: 30, pageSize: 10 })).toEqual([1, 2, 3]);
  });

  it("возвращает все страницы, когда их ровно столько, сколько порог (6 страниц, siblingsCount=1)", () => {
    // totalPageNumbers = 1 + 5 = 6, totalPages = 6
    expect(pagination({ currentPage: 3, totalItems: 60, pageSize: 10 })).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("возвращает одну страницу", () => {
    expect(pagination({ currentPage: 1, totalItems: 5, pageSize: 10 })).toEqual([1]);
  });

  it("возвращает две страницы", () => {
    expect(pagination({ currentPage: 1, totalItems: 15, pageSize: 10 })).toEqual([1, 2]);
  });

  it("возвращает пустой массив, когда нет элементов", () => {
    expect(pagination({ currentPage: 1, totalItems: 0, pageSize: 10 })).toEqual([]);
  });
});

describe("левый блок + многоточие справа (!showLeftDots && showRightDots)", () => {
  // 10 страниц, siblingsCount=1 → leftItemCount = 3 + 2*1 = 5

  it("currentPage = 1", () => {
    expect(pagination({ currentPage: 1 })).toEqual([1, 2, 3, 4, 5, "...", 10]);
  });

  it("currentPage = 2", () => {
    expect(pagination({ currentPage: 2 })).toEqual([1, 2, 3, 4, 5, "...", 10]);
  });

  it("currentPage = 3", () => {
    expect(pagination({ currentPage: 3 })).toEqual([1, 2, 3, 4, 5, "...", 10]);
  });

  it("siblingsCount=2 расширяет левый блок", () => {
    // totalPageNumbers = 2 + 5 = 7, leftItemCount = 3 + 4 = 7
    expect(pagination({ currentPage: 1, siblingsCount: 2 })).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      "...",
      10,
    ]);
  });

  it("последний элемент всегда равен totalPages", () => {
    const result = pagination({ currentPage: 1, totalItems: 200, pageSize: 10 });
    expect(result[result.length - 1]).toBe(20);
  });

  it("предпоследний элемент — многоточие", () => {
    const result = pagination({ currentPage: 1 });
    expect(result[result.length - 2]).toBe("...");
  });
});

describe("многоточие слева + правый блок (showLeftDots && !showRightDots)", () => {
  it("currentPage = последняя страница", () => {
    expect(pagination({ currentPage: 10 })).toEqual([1, "...", 6, 7, 8, 9, 10]);
  });

  it("currentPage = предпоследняя страница", () => {
    expect(pagination({ currentPage: 9 })).toEqual([1, "...", 6, 7, 8, 9, 10]);
  });

  it("currentPage = 8", () => {
    expect(pagination({ currentPage: 8 })).toEqual([1, "...", 6, 7, 8, 9, 10]);
  });

  it("siblingsCount=2 расширяет правый блок", () => {
    // rightItemCount = 3 + 4 = 7, rightRange = [4..10]
    expect(pagination({ currentPage: 10, siblingsCount: 2 })).toEqual([
      1,
      "...",
      4,
      5,
      6,
      7,
      8,
      9,
      10,
    ]);
  });

  it("первый элемент всегда 1", () => {
    const result = pagination({ currentPage: 10 });
    expect(result[0]).toBe(1);
  });

  it("второй элемент — многоточие", () => {
    const result = pagination({ currentPage: 10 });
    expect(result[1]).toBe("...");
  });
});

describe("оба многоточия (showLeftDots && showRightDots)", () => {
  it("currentPage = 5 (центр)", () => {
    expect(pagination({ currentPage: 5 })).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("currentPage = 6", () => {
    expect(pagination({ currentPage: 6 })).toEqual([1, "...", 5, 6, 7, "...", 10]);
  });

  it("currentPage ровно посередине большого диапазона", () => {
    expect(pagination({ currentPage: 10, totalItems: 200, pageSize: 10 })).toEqual([
      1,
      "...",
      9,
      10,
      11,
      "...",
      20,
    ]);
  });

  it("siblingsCount=2 расширяет среднюю часть", () => {
    expect(pagination({ currentPage: 5, siblingsCount: 2 })).toEqual([
      1,
      "...",
      3,
      4,
      5,
      6,
      7,
      "...",
      10,
    ]);
  });

  it("siblingsCount=3 с большим количеством страниц", () => {
    expect(
      pagination({ currentPage: 10, totalItems: 200, pageSize: 10, siblingsCount: 3 }),
    ).toEqual([1, "...", 7, 8, 9, 10, 11, 12, 13, "...", 20]);
  });

  it("первый и последний элементы — номера крайних страниц", () => {
    const result = pagination({ currentPage: 5 });
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(10);
  });

  it("содержит ровно два многоточия", () => {
    const result = pagination({ currentPage: 5 });
    const dots = result.filter((item) => item === "...");
    expect(dots).toHaveLength(2);
  });

  it("текущая страница присутствует в результате", () => {
    const result = pagination({ currentPage: 6 });
    expect(result).toContain(6);
  });
});

describe("граничные переходы между режимами", () => {
  /*
   При 10 страницах и siblingsCount=1:
   currentPage 1–3 → левый блок
   currentPage 4   → переход: leftSibling=3 > 2 → showLeftDots=true
                     rightSibling=5 < 8 → showRightDots=true → оба dots
   */

  it("currentPage=3 → левый блок (без левого многоточия)", () => {
    const result = pagination({ currentPage: 3 });
    expect(result).toEqual([1, 2, 3, 4, 5, "...", 10]);
  });

  it("currentPage=4 → оба многоточия", () => {
    const result = pagination({ currentPage: 4 });
    expect(result).toEqual([1, "...", 3, 4, 5, "...", 10]);
  });

  it("currentPage=7 → оба многоточия", () => {
    const result = pagination({ currentPage: 7 });
    expect(result).toEqual([1, "...", 6, 7, 8, "...", 10]);
  });

  it("currentPage=8 → правый блок (без правого многоточия)", () => {
    const result = pagination({ currentPage: 8 });
    expect(result).toEqual([1, "...", 6, 7, 8, 9, 10]);
  });
});

describe("различные pageSize", () => {
  it("pageSize=5 → 20 страниц, текущая в середине", () => {
    expect(pagination({ currentPage: 10, totalItems: 100, pageSize: 5 })).toEqual([
      1,
      "...",
      9,
      10,
      11,
      "...",
      20,
    ]);
  });

  it("pageSize=25 → 4 страницы, все видны", () => {
    expect(pagination({ currentPage: 2, totalItems: 100, pageSize: 25 })).toEqual([1, 2, 3, 4]);
  });

  it("pageSize=1 → много страниц", () => {
    expect(pagination({ currentPage: 50, totalItems: 100, pageSize: 1 })).toEqual([
      1,
      "...",
      49,
      50,
      51,
      "...",
      100,
    ]);
  });
});

describe("siblingsCount по умолчанию (= 1)", () => {
  it("без явного siblingsCount показывает по одному соседу", () => {
    const result = pagination({ currentPage: 5 });
    // middle = [4, 5, 6] → по одному соседу
    expect(result).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });
});

describe("мемоизация", () => {
  it("возвращает тот же массив при тех же входных данных", () => {
    const props = { currentPage: 5, totalItems: 100, pageSize: 10 };
    const { result, rerender } = renderHook((p) => usePagination(p), { initialProps: props });

    const first = result.current;
    rerender(props);
    const second = result.current;

    expect(first).toBe(second);
  });

  it("возвращает новый массив при изменении currentPage", () => {
    const { result, rerender } = renderHook((p) => usePagination(p), {
      initialProps: { currentPage: 5, totalItems: 100, pageSize: 10 },
    });

    const first = result.current;
    rerender({ currentPage: 6, totalItems: 100, pageSize: 10 });
    const second = result.current;

    expect(first).not.toBe(second);
    expect(second).toEqual([1, "...", 5, 6, 7, "...", 10]);
  });

  it("возвращает новый массив при изменении totalItems", () => {
    const { result, rerender } = renderHook((p) => usePagination(p), {
      initialProps: { currentPage: 1, totalItems: 100, pageSize: 10 },
    });

    const first = result.current;
    rerender({ currentPage: 1, totalItems: 50, pageSize: 10 });
    const second = result.current;

    expect(first).not.toBe(second);
  });
});

describe("структурные инварианты(т.е. всегда истина)", () => {
  it("массив никогда не содержит дубликатов номеров страниц", () => {
    for (let page = 1; page <= 10; page++) {
      const result = pagination({ currentPage: page });
      const numbers = result.filter((item): item is number => typeof item === "number");
      const unique = new Set(numbers);
      expect(unique.size).toBe(numbers.length);
    }
  });

  it("номера страниц идут в порядке возрастания", () => {
    for (let page = 1; page <= 10; page++) {
      const result = pagination({ currentPage: page });
      const numbers = result.filter((item): item is number => typeof item === "number");
      for (let i = 1; i < numbers.length; i++) {
        expect(numbers[i]).toBeGreaterThan(numbers[i - 1]);
      }
    }
  });

  it("многоточие никогда не стоит на первом или последнем месте", () => {
    for (let page = 1; page <= 10; page++) {
      const result = pagination({ currentPage: page });
      if (result.length > 0) {
        expect(result[0]).not.toBe("...");
        expect(result[result.length - 1]).not.toBe("...");
      }
    }
  });

  it("текущая страница всегда присутствует в результате", () => {
    for (let page = 1; page <= 10; page++) {
      const result = pagination({ currentPage: page });
      expect(result).toContain(page);
    }
  });

  it("первая и последняя страницы всегда присутствуют (если есть страницы)", () => {
    for (let page = 1; page <= 10; page++) {
      const result = pagination({ currentPage: page });
      expect(result).toContain(1);
      expect(result).toContain(10);
    }
  });
});
