import { useEffect, useRef } from "react";

/**
 * Выполняет автопоиск по значению qFromUrl, когда данные для поиска впервые становятся доступны.
 *
 * Основная идея:
 * - URL может содержать q (например, пользователь открыл глубокую ссылку со строкой поиска).
 * - реальный поиск (searchExactAndSetPage) надо запускать только когда “данные появились”
 *   (например, загружены строки/индекс/список, по которому можно искать).
 * - автопоиск должен выполниться ровно один раз на инстанс хука, чтобы не дёргать повторно
 *   поиск при последующих ререндерах, изменениях параметров и т.п.
 *
 * Условия запуска:
 * - qFromUrl не пустая строка
 * - queryHasData === true
 * - поиск ещё не выполнялся в этом инстансе хука
 *
 * Гарантии:
 * - После первого успешного старта автопоиска дальнейшие изменения qFromUrl,
 *   queryHasData или searchExactAndSetPage не приведут к повторному автопоиску
 *   (пока инстанс хука не будет размонтирован).
 *
 * Побочные эффекты:
 * - вызывает searchExactAndSetPage(qFromUrl) (Promise результат намеренно игнорируется).
 *
 * @param params Параметры автопоиска
 * @param params.qFromUrl Строка поиска из URL (или пустая строка)
 * @param params.queryHasData Флаг “данные доступны для поиска”
 * @param params.searchExactAndSetPage Функция, выполняющая поиск и выставляющая страницу
 *
 * @example
 * useInitialSearchFromUrl({
 *   qFromUrl,
 *   queryHasData: rows.length > 0,
 *   searchExactAndSetPage: async (q) => {
 *     // ... найти точное совпадение и перейти на страницу
 *   },
 * });
 */
export const useInitialSearchFromUrl = (params: {
  qFromUrl: string;
  queryHasData: boolean;
  searchExactAndSetPage: (q: string) => Promise<void>;
}) => {
  const { qFromUrl, queryHasData, searchExactAndSetPage } = params;
  const initialSearchDoneRef = useRef(false);

  useEffect(() => {
    if (initialSearchDoneRef.current) return;
    if (!qFromUrl) return;
    if (!queryHasData) return;

    initialSearchDoneRef.current = true;
    void searchExactAndSetPage(qFromUrl);
  }, [qFromUrl, queryHasData, searchExactAndSetPage]);
};
