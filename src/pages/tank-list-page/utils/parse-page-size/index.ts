import { PAGINATION_PAGE_SIZES } from "../../constants";
import type { PaginationPageSize } from "../../types";

/**
 * Парсит размер страницы из строки URL и валидирует по списку допустимых значений.
 
 * Преобразует входное значение через Number(...) и возвращает его только если оно
 * входит в список PAGINATION_PAGE_SIZES. Иначе возвращает fallback.
 *
 * @param value - Строковое значение (например, из URLSearchParams.get("pageSize")) или null.
 * @param fallback - Значение по умолчанию, если value не задано или невалидно.
 * @returns Валидный размер страницы из набора PAGINATION_PAGE_SIZES либо fallback.
 *
 * @example
 * parsePageSize("20", 10);   // 20
 * parsePageSize("777", 10);  // 10
 * parsePageSize(null, 10);   // 10
 * parsePageSize("abc", 10);  // 10
 */
export const parsePageSize = (
  value: string | null,
  fallback: PaginationPageSize,
): PaginationPageSize => {
  const n = Number(value);
  return (PAGINATION_PAGE_SIZES as readonly number[]).includes(n)
    ? (n as PaginationPageSize)
    : fallback;
};
