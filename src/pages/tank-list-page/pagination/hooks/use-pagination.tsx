import { useMemo } from "react";
import { getRange, getTotalPages } from "../utils";

/**
 * Параметры пагинации для хука {@link usePagination}.
 */
type Pagination = {
  /** Текущая активная страница (1-based). */
  currentPage: number;
  /** Общее количество элементов во всей коллекции. */
  totalItems: number;
  /** Количество элементов на одной странице. */
  pageSize: number;
  /**
   * Количество страниц-соседей слева и справа от текущей.
   * @default 1
   */
  siblingsCount?: number;
};

/**
 * Хук пагинации — вычисляет массив элементов для отображения навигации по страницам.
 *
 * Возвращает массив, содержащий номера страниц и разделители "...",
 * например: [1, "...", 4, 5, 6, "...", 10].
 *
 * Логика адаптируется к положению текущей страницы:
 * - **Мало страниц** — показываются все без многоточий
 * - **Текущая ближе к началу** — полный левый блок + "..." + последняя
 * - **Текущая ближе к концу** — первая + "..." + полный правый блок
 * - **Текущая в середине** — первая + "..." + окрестность + "..." + последняя
 *
 * @param options — параметры пагинации
 * @param options.currentPage — текущая активная страница (1-based)
 * @param options.totalItems — общее количество элементов
 * @param options.pageSize — количество элементов на странице
 * @param options.siblingsCount — количество страниц-соседей слева и справа
 *   от текущей (по умолчанию 1)
 * @returns мемоизированный массив (number | string)[] для рендера пагинации
 *
 * @example
 * usePagination({ currentPage: 1, totalItems: 100, pageSize: 10 });
 * // → [1, 2, 3, 4, 5, "...", 10]
 *
 * @example
 * usePagination({ currentPage: 5, totalItems: 100, pageSize: 10 });
 * // → [1, "...", 4, 5, 6, "...", 10]
 *
 * @example
 * usePagination({ currentPage: 10, totalItems: 100, pageSize: 10 });
 * // → [1, "...", 6, 7, 8, 9, 10]
 */
export const usePagination = ({
  currentPage,
  totalItems,
  pageSize,
  siblingsCount = 1, // Сколько страниц показывать рядом с текущей
}: Pagination) => {
  return useMemo(() => {
    const totalPages = getTotalPages(totalItems, pageSize);
    const totalPageNumbers = siblingsCount + 5; // 1 + siblings + current + siblings + 1

    // Если страниц мало, показываем все
    if (totalPageNumbers >= totalPages) {
      return getRange(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Логика формирования массива страниц (например: [1, '...', 5, 6, 7, '...', 10])
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingsCount;
      const leftRange = getRange(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingsCount;
      const rightRange = getRange(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = getRange(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  }, [currentPage, totalItems, pageSize, siblingsCount]);
};
