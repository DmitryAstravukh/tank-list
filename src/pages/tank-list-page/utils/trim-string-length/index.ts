/**
 * Ограничивает длину пользовательского ввода.
 *
 * @param string - Ввод пользователя.
 * @param maxLen - Максимально допустимая длина.
 * @returns Строка длиной не более maxLen.
 *
 * @example
 * ```ts
 * clampQueryLength("hello", 3); // "hel"
 * clampQueryLength("hi", 3);    // "hi"
 * ```
 *
 * @remarks
 * slice работает по UTF-16 code units, поэтому теоретически может обрезать строку
 * посередине суррогатной пары (некоторые emoji). Для обычных текстовых запросов
 * это обычно не критично.
 */
export const trimStringLength = (string: string, maxLen: number) =>
  string.length > maxLen ? string.slice(0, maxLen) : string;
