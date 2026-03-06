import { useCallback, useRef, useState } from "react";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import type { TanksPage } from "../../api";
import type { PaginationPageSize, RequestedTank } from "../../types";
import { dedupeByTankIdKeepOrder } from "../../utils";
import { normalizeForSearch } from "../../utils/normalize-for-search";
import type { PatchUrlFn } from "../use-tank-browser-url-state";

/**
 * useTankExactSearch — “точный” поиск танка по имени с догрузкой страниц.
 *
 * Идея:
 * - Берём введённую строку raw, нормализуем через normalizeForSearch (для сравнения).
 * - Ищем точное совпадение normalizeForSearch(tank.name) === normalizeForSearch(raw).
 * - Если среди уже загруженных страниц не нашли — вызываем query.fetchNextPage() и повторяем,
 *   пока не найдём или пока на сервере не закончатся страницы.
 *
 * Что выставляет в состоянии:
 * - foundTankId: tank_id найденного танка (для подсветки)
 * - foundIndex: “глобальный” индекс найденного элемента в плоском массиве загруженных танков
 * - notFound: строка raw.trim(), если точное совпадение не найдено
 * - isSearching: флаг активного поиска (true во время цикла, false в finally)
 *
 * Навигация/URL:
 * - Если raw после нормализации пустой — очищает q в URL и ставит page=1.
 * - Если найдено — вычисляет uiPage = floor(foundIndex / pageSize) + 1,
 *   выставляет currentPage и патчит URL { q: raw.trim(), page: uiPage }.
 * - Если не найдено — патчит URL { q: raw.trim(), page: 1 }.
 *
 * Координация с ensure догрузкой:
 * - При старте поиска вызывает cancelEnsure(), чтобы остановить/отменить текущий ensure-цикл.
 * - На время поиска поднимает isSearchingRef.current = true, чтобы другие части могли не мешать.
 *
 * Защиты:
 * - Если query.data ещё нет — поиск не запускается.
 * - Если isSearchingRef.current уже true — повторный запуск игнорируется.
 */
export const useTankExactSearch = (params: {
  query: UseInfiniteQueryResult<TanksPage, Error>;
  pageSize: PaginationPageSize;
  patchUrl: PatchUrlFn;
  setCurrentPage: (page: number) => void;
  cancelEnsure: () => void;
}) => {
  const { query, pageSize, patchUrl, setCurrentPage, cancelEnsure } = params;

  const queryRef = useRef(query);
  queryRef.current = query;

  const [foundTankId, setFoundTankId] = useState<number | null>(null);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  const isSearchingRef = useRef(false);

  const resetSearchState = useCallback(() => {
    setFoundTankId(null);
    setFoundIndex(null);
    setNotFound(null);
  }, []);

  const searchExactAndSetPage = useCallback(
    async (raw: string) => {
      const needle = normalizeForSearch(raw);

      setNotFound(null);
      setFoundTankId(null);
      setFoundIndex(null);

      if (!needle) {
        patchUrl({ q: null, page: 1 });
        return;
      }

      const q = queryRef.current;
      if (!q.data) return;
      if (isSearchingRef.current) return;

      // блокируем ensure на время поиска
      isSearchingRef.current = true;
      setIsSearching(true);

      // отменяем текущий ensure-цикл (если он был)
      cancelEnsure();

      try {
        const needleNorm = normalizeForSearch(needle);

        const findIndexByName = (items: RequestedTank[]) =>
          items.findIndex((t) => normalizeForSearch(t.name) === needleNorm);

        let pages = q.data.pages;
        let items = dedupeByTankIdKeepOrder(pages.flatMap((p) => p.items));
        let idx = findIndexByName(items);

        while (idx === -1) {
          const currentQ = queryRef.current;
          if (currentQ.isError) break;

          const lastPage = pages[pages.length - 1];
          const hasMoreOnServer = lastPage.meta.page < lastPage.meta.page_total;
          if (!hasMoreOnServer) break;

          const res = await currentQ.fetchNextPage();
          if (res.isError) break;

          pages = res.data?.pages ?? pages;

          items = dedupeByTankIdKeepOrder(pages.flatMap((p) => p.items));
          idx = findIndexByName(items);
        }

        if (idx !== -1) {
          setFoundTankId(items[idx].tank_id);
          setFoundIndex(idx);

          const uiPage = Math.floor(idx / pageSize) + 1;

          setCurrentPage(uiPage);
          patchUrl({ q: raw.trim(), page: uiPage });
        } else {
          setNotFound(raw.trim());
          patchUrl({ q: raw.trim(), page: 1 });
        }
      } finally {
        isSearchingRef.current = false;
        setIsSearching(false);
      }
    },
    [cancelEnsure, patchUrl, pageSize, setCurrentPage],
  );

  const handleSearchClick = useCallback(
    (string: string) => () => {
      void searchExactAndSetPage(string);
    },
    [searchExactAndSetPage],
  );

  return {
    searchExactAndSetPage,
    handleSearchClick,

    resetSearchState,

    foundTankId,
    foundIndex,
    isSearching,
    notFound,

    isSearchingRef,
    setNotFound,
  };
};
