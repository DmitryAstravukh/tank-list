import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { DEFAULT_PAGE, SERVER_LIMIT } from "../../constants";
import type { PaginationPageSize } from "../../types";
import { useClampUiPage } from "../use-clamp-ui-page";
import { useEnsureDataForUiPage } from "../use-ensure-data-for-ui-page";
import { useInitialSearchFromUrl } from "../use-initial-search-from-url";
import { useTankBrowserUrlState } from "../use-tank-browser-url-state";
import { useTankExactSearch } from "../use-tank-exact-search";
import { useTanksInfiniteData } from "../use-tank-infinite-data";

/**
 * Главный компоновочный хук страницы списка танков.
 *
 * Собирает в одном месте:
 * - URL-синхронизацию (page, pageSize, q) через {@link useTankBrowserUrlState}
 * - Инфинит-данные (накопленные страницы/список) через {@link useTanksInfiniteData}
 * - Клампинг UI-страницы в допустимый диапазон через {@link useClampUiPage}
 * - Догрузку данных под текущую UI-страницу (ensure) через {@link useEnsureDataForUiPage}
 * - Точный поиск по имени (с догрузкой страниц и переходом на страницу найденного) через {@link useTankExactSearch}
 * - Автопоиск при перезагрузке, если q есть в URL и данные уже доступны, через {@link useInitialSearchFromUrl}
 *
 * Ключевая логика:
 * - totalUiPages = max(1, ceil(totalItems / pageSize))
 * - rows` — это срез allTanks под текущую UI-страницу: slice((page-1)*pageSize, page*pageSize)
 * - На изменения currentPage/pageSize вызывается ensureDataForUiPage(currentPage, pageSize)
 * - При pageSize change сбрасывается состояние поиска и notFound, и устанавливается page = DEFAULT_PAGE
 * - handlePageChange нормализует вход: Math.max(1, Math.floor(page))
 *
 * Возвращаемое значение предназначено для прямого проброса в компоненты:
 * Header (поиск/размер страницы), Table (rows/found), Pagination (страница/итого).
 *
 * @returns Модель состояния и обработчики:
 * - qFromUrl — текущее значение q из URL (или "")
 * - currentPage, pageSize, totalItems
 * - handlePageChange, handlePageSizeChange, handleSearchClick, handleSearchClear
 * - rows — строки текущей UI-страницы
 * - foundTankId, foundIndex — результаты точного поиска
 * - isSearching, notFound
 * - loadedCount — сколько всего элементов уже загружено в allTanks
 * - serverLimit — ограничение сервера (константа)
 *
 * @example
 * const vm = useTanks();
 * <Header
 *   qFromUrl={vm.qFromUrl}
 *   handleSearchClick={vm.handleSearchClick}
 *   handleSearchClear={vm.handleSearchClear}
 *   handlePageSizeChange={vm.handlePageSizeChange}
 * />
 * <Table rows={vm.rows} foundTankId={vm.foundTankId} />
 * <Pagination
 *   currentPage={vm.currentPage}
 *   totalItems={vm.totalItems}
 *   pageSize={vm.pageSize}
 *   handlePageChange={vm.handlePageChange}
 * />
 */
export const useTanks = () => {
  const { qFromUrl, currentPage, setCurrentPage, pageSize, setPageSize, patchUrl } =
    useTankBrowserUrlState();

  const { query, totalItems, allTanks } = useTanksInfiniteData();

  const totalUiPages = useMemo(
    () => Math.max(1, Math.ceil((totalItems || 0) / pageSize)),
    [totalItems, pageSize],
  );

  useClampUiPage({
    queryHasData: Boolean(query.data),
    currentPage,
    totalUiPages,
    //setCurrentPage: (p) => setCurrentPage(p),
    setCurrentPage,
    patchUrl,
  });

  // Общий флаг “поиск идёт”, чтобы:
  // - ensure не вмешивался во время поиска
  // - поиск мог выставлять/снимать его (через search-хук)
  const isSearchingRef = useRef(false);

  // Ensure: догружаем данные под текущую UI-страницу
  const { ensureDataForUiPage, cancelEnsure } = useEnsureDataForUiPage({
    query,
    totalItems,
    allTanksLength: allTanks.length,
    isSearchingRef,
  });

  // Поиск: точное совпадение имени + догрузка страниц
  const {
    searchExactAndSetPage,
    handleSearchClick,
    resetSearchState,
    foundTankId,
    foundIndex,
    isSearching,
    notFound,
    setNotFound,
  } = useTankExactSearch({
    query,
    pageSize,
    patchUrl,
    //setCurrentPage: (p) => setCurrentPage(p),
    setCurrentPage,
    cancelEnsure,
  });

  // Синхронизируем ref с фактом поиска (на случай, если кто-то читает ref)
  // Внутри searchExactAndSetPage ref выставляется точно, но это делает состояние устойчивее.
  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);

  // ensure на смену страницы/размера
  useEffect(() => {
    void ensureDataForUiPage(currentPage, pageSize);
  }, [currentPage, pageSize, ensureDataForUiPage]);

  const rows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allTanks.slice(start, start + pageSize);
  }, [allTanks, currentPage, pageSize]);

  // Автопоиск при перезагрузке, если q есть в URL
  useInitialSearchFromUrl({
    qFromUrl,
    queryHasData: Boolean(query.data),
    searchExactAndSetPage,
  });

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.max(1, Math.floor(page));
      setCurrentPage(nextPage);
      patchUrl({ page: nextPage });
    },
    [patchUrl, setCurrentPage],
  );

  const handlePageSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const nextSize = Number(e.target.value) as PaginationPageSize;

      setPageSize(nextSize);
      setCurrentPage(DEFAULT_PAGE);

      resetSearchState();
      setNotFound(null);

      patchUrl({ pageSize: nextSize, page: DEFAULT_PAGE });
    },
    [patchUrl, resetSearchState, setCurrentPage, setNotFound, setPageSize],
  );

  const handleSearchClear = useCallback(() => {
    resetSearchState();
    setCurrentPage(DEFAULT_PAGE);
    patchUrl({ q: null, page: DEFAULT_PAGE });
  }, [patchUrl, resetSearchState, setCurrentPage]);

  return {
    qFromUrl,

    currentPage,
    pageSize,
    totalItems,

    handlePageChange,
    handlePageSizeChange,
    handleSearchClick,
    handleSearchClear,

    rows,
    foundTankId,
    foundIndex,

    isSearching,
    notFound,
    loadedCount: allTanks.length,
    serverLimit: SERVER_LIMIT,
  };
};
