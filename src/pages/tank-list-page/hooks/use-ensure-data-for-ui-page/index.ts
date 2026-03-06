import type React from "react";
import { useCallback, useRef } from "react";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import type { TanksPage } from "../../api";
import type { PaginationPageSize } from "../../types";
import { dedupeByTankIdKeepOrder } from "../../utils";

/**
 * Ленивая догрузка данных под “UI-страницу” (page/pageSize), когда используется infinite query.
 *
 * Идея:
 * - UI-страница N при pageSize=S требует, чтобы в памяти было минимум N*S элементов (или totalItems, если меньше).
 * - Если сейчас загружено меньше, хук вызывает query.fetchNextPage() до тех пор, пока:
 *   - не будет загружено достаточно элементов (loadedCount >= targetCount), или
 *   - не закончатся страницы на сервере (page === page_total), или
 *   - запрос начнёт ошибаться/будет в состоянии fetchingNextPage.
 *
 * Защита от некорректных сценариев:
 * - Во время поиска (isSearchingRef.current === true) ensure не запускается.
 * - Mutex (isEnsuringRef) предотвращает параллельные ensure-циклы.
 * - ensureRunIdRef позволяет отменить устаревший ensure-цикл (cancelEnsure увеличивает runId).
 *
 * Важно:
 * - allTanksLength — длина уже загруженного (и дедуплицированного) списка на момент рендера.
 * - Фактический loadedCount внутри цикла пересчитывается из страниц query.data (через dedupeByTankIdKeepOrder).
 *
 * @param params.query Infinite query результат (UseInfiniteQueryResult).
 * @param params.totalItems Общее количество элементов на сервере (meta.total).
 * @param params.allTanksLength Сколько элементов уже загружено (dedupe).
 * @param params.isSearchingRef Ref-флаг активного поиска (если true — ensure отключён).
 *
 * @returns Объект:
 * - ensureDataForUiPage(page, size): Promise<void> — догрузка данных под UI страницу
 * - cancelEnsure(): void — отмена текущего/устаревшего ensure-цикла
 * - isEnsuringRef: MutableRefObject<boolean> — флаг “ensure сейчас выполняется”
 */
export const useEnsureDataForUiPage = (params: {
  query: UseInfiniteQueryResult<TanksPage, Error>;
  totalItems: number;
  allTanksLength: number;
  isSearchingRef: React.MutableRefObject<boolean>;
}) => {
  const { query, totalItems, allTanksLength, isSearchingRef } = params;

  const queryRef = useRef(query);
  queryRef.current = query;

  const ensureRunIdRef = useRef(0);
  const isEnsuringRef = useRef(false);

  const cancelEnsure = useCallback(() => {
    ensureRunIdRef.current += 1;
  }, []);

  const ensureDataForUiPage = useCallback(
    async (page: number, size: PaginationPageSize) => {
      if (isSearchingRef.current) return;
      if (isEnsuringRef.current) return;
      if (!totalItems) return;

      const q = queryRef.current;

      if (!q.data) return;
      if (q.isError) return;
      if (q.isFetchingNextPage) return;

      const targetCount = Math.min(page * size, totalItems);
      if (allTanksLength >= targetCount) return;

      const runId = ++ensureRunIdRef.current;
      isEnsuringRef.current = true;

      try {
        let pages = q.data.pages;
        let loadedCount = allTanksLength;

        while (loadedCount < targetCount) {
          if (ensureRunIdRef.current !== runId) return;

          const currentQ = queryRef.current;
          if (currentQ.isError) break;
          if (currentQ.isFetchingNextPage) break;

          const lastPage = pages[pages.length - 1];
          const hasMoreOnServer = lastPage.meta.page < lastPage.meta.page_total;
          if (!hasMoreOnServer) break;

          const res = await currentQ.fetchNextPage();
          if (res.isError) break;

          pages = res.data?.pages ?? pages;
          loadedCount = dedupeByTankIdKeepOrder(pages.flatMap((p) => p.items)).length;
        }
      } finally {
        if (ensureRunIdRef.current === runId) {
          isEnsuringRef.current = false;
        }
      }
    },
    [totalItems, allTanksLength, isSearchingRef],
  );

  return { ensureDataForUiPage, cancelEnsure, isEnsuringRef };
};
