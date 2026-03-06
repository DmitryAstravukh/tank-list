import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTanksPage, type TanksPage } from "../../api";
import { TANK_STALE_TIME, TANKS_INFINITE_QUERY_KEY } from "../../constants";
import { dedupeByTankIdKeepOrder } from "../../utils";

/**
 * Слой данных для бесконечной подгрузки списка танков.
 *
 * Использует useInfiniteQuery для постраничной загрузки танков с сервера.
 * Автоматически определяет следующую страницу через getNextPageParam.
 *
 * Возвращаемые данные:
 * - query: объект useInfiniteQuery (data, fetchNextPage, isFetching, isError и т.д.)
 * - totalItems: общее количество танков на сервере (из meta первой страницы)
 * - allTanks: плоский массив всех загруженных танков с дедупликацией по tank_id
 *
 * Особенности:
 * - Дедупликация: если сервер вернул дубли (например, при сдвиге данных между запросами),
 *   они будут убраны через dedupeByTankIdKeepOrder (сохраняется порядок первого вхождения).
 * - useErrorBoundary: true — при ошибке запроса компонент выбросит ошибку в ErrorBoundary.
 * - staleTime: TANK_STALE_TIME — данные считаются свежими указанное время.
 *
 * @returns {{ query: UseInfiniteQueryResult, totalItems: number, allTanks: RequestedTank[] }}
 */
export const useTanksInfiniteData = () => {
  const query = useInfiniteQuery<TanksPage, Error>({
    queryKey: TANKS_INFINITE_QUERY_KEY,
    queryFn: ({ pageParam = 1, signal }) => fetchTanksPage({ pageParam, signal }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.page_total ? lastPage.meta.page + 1 : undefined,
    staleTime: TANK_STALE_TIME,
    useErrorBoundary: true,
  });

  const totalItems = query.data?.pages?.[0]?.meta.total ?? 0;

  const allTanks = useMemo(() => {
    const flat = (query.data?.pages ?? []).flatMap((p) => p.items);
    return dedupeByTankIdKeepOrder(flat);
  }, [query.data?.pages]);

  return { query, totalItems, allTanks };
};
