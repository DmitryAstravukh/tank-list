/**
 * Нормализует строку для диакритик-независимого поиска.
 *
 * Делает строку сопоставимой для простого поиска через includes() или прямое сравнение:
 * 1) trim() — убирает пробелы по краям
 * 2) toLocaleLowerCase() — приводит к нижнему регистру
 * 3) normalize('NFKD') — раскладывает символы на базовую букву + диакритика
 * 4) удаляет диакритические символы (например, ö -> o)
 * 5) приводит ß -> ss (частый кейс для немецкого)
 * 6) схлопывает множественные пробелы до одного
 *
 * @param input - Исходная строка (ввод пользователя или индексируемое значение).
 * @returns Нормализованная строка, пригодная для сравнения и поиска.
 *
 * @example
 * ```ts
 * normalizeForSearch("Löwe");       // "lowe"
 * normalizeForSearch("  Löwe  ");   // "lowe"
 * normalizeForSearch("Straße");     // "strasse"
 * normalizeForSearch("Foo   Bar");  // "foo bar"
 * ```
 */
export const normalizeForSearch = (input: string) => {
  return input
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
};
