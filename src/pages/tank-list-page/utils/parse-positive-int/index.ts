/**
 * Парсит положительное целое число из строки (например, из query-параметра URL).
 *
 * Алгоритм:
 * 1) Преобразует value через Number(value)
 * 2) Если получилось не конечное число NaN, Infinity, -Infinity) — возвращает fallback
 * 3) Округляет вниз (Math.floor)
 * 4) Если результат >= 1 — возвращает его, иначе возвращает fallback
 *
 * @param value - Строковое значение или null (например, URLSearchParams.get("page")).
 * @param fallback - Значение по умолчанию, если value отсутствует или невалидно.
 * @returns Положительное целое число (>= 1) либо fallback.
 *
 * @example
 * parsePositiveInt("5", 1);     // 5
 * parsePositiveInt("5.9", 1);   // 5
 * parsePositiveInt("0", 1);     // 1
 * parsePositiveInt("-2", 1);    // 1
 * parsePositiveInt("abc", 1);   // 1
 * parsePositiveInt(null, 1);    // 1
 */
export const parsePositiveInt = (value: string | null, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i >= 1 ? i : fallback;
};
