import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTanksPage, type TanksPage } from "../api";
import { SERVER_LIMIT, TANKS_INFINITE_QUERY_KEY } from "../constants";
import type { PaginationPageSize, RequestedTank } from "../types";
import { clamp, dedupeByTankIdKeepOrder, parsePageSize, parsePositiveInt } from "../utils";
import { normalizeForSearch } from "../utils/normalize-for-search";

/**
 * Хук управления браузером танков с пагинацией, поиском и синхронизацией URL.
 *
 * Функциональность:
 * - Пагинация с синхронизацией в URL (page, pageSize)
 * - Поиск по имени танка с автоматической догрузкой страниц
 * - Ленивая догрузка данных при переходе на страницу, данные которой ещё не загружены
 * - Дедупликация танков по tank_id
 * - Подсветка найденного элемента
 * - Автопоиск при загрузке страницы, если в URL есть параметр q
 *
 * Синхронизация с URL:
 * - page: номер текущей страницы (целое число >= 1)
 * - pageSize: размер страницы (из списка PAGINATION_PAGE_SIZES)
 * - q: строка поиска (нормализуется для диакритик-независимого сравнения)
 *
 * @returns {Object} Объект с состоянием и методами управления:
 * @returns {string} qFromUrl - Текущее значение поиска из URL
 * @returns {number} currentPage - Текущая страница (1-based)
 * @returns {PaginationPageSize} pageSize - Размер страницы
 * @returns {number} totalItems - Общее количество танков на сервере
 * @returns {Function} handlePageChange - Обработчик смены страницы
 * @returns {Function} handlePageSizeChange - Обработчик смены размера страницы
 * @returns {Function} handleSearchClick - Обработчик клика по кнопке поиска (каррированная)
 * @returns {Function} handleSearchClear - Обработчик очистки поиска
 * @returns {RequestedTank[]} rows - Танки для отображения на текущей странице
 * @returns {number | null} foundTankId - ID найденного танка (для подсветки)
 * @returns {number | null} foundIndex - Глобальный индекс найденного танка
 * @returns {boolean} isSearching - Флаг активного поиска
 * @returns {string | null} notFound - Строка, которая не была найдена
 * @returns {number} loadedCount - Количество загруженных танков
 * @returns {number} serverLimit - Лимит запроса к серверу (константа)
 *
 * @example
 * const {
 *   rows,
 *   currentPage,
 *   handlePageChange,
 *   handleSearchClick
 * } = useTanksBrowserController();
 *
 * // Использование в компоненте
 * <Table rows={rows} />
 * <Pagination currentPage={currentPage} onPageChange={handlePageChange} />
 * <button onClick={handleSearchClick(searchValue)}>Найти</button>
 */
//P.S. в идеале раздробить его на более мелкие, прастити
export const useTanksBrowserController = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState<number>(() =>
    parsePositiveInt(searchParams.get("page"), 1),
  );
  const [pageSize, setPageSize] = useState<PaginationPageSize>(() =>
    parsePageSize(searchParams.get("pageSize"), 10),
  );
  const qFromUrl = searchParams.get("q") ?? "";

  // для подсветки/скролла
  const [foundTankId, setFoundTankId] = useState<number | null>(null);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  // ensure page data
  // const [isEnsuringPage, setIsEnsuringPage] = useState(false);

  // Счётчик-токен для отмены устаревших async-циклов догрузки.
  // При каждом вызове ensureDataForUiPage берётся новый id (++).
  // Если пользователь быстро переключил страницу — старый цикл
  // сравнивает свой runId с текущим значением ref и прерывается,
  // не затирая результаты нового вызова.
  const ensureRunIdRef = useRef(0);

  //  helper: патчим URL (НЕ автоматически, только когда мы сами вызываем)
  const patchUrl = useCallback(
    (
      patch: { page?: number | null; pageSize?: PaginationPageSize | null; q?: string | null },
      opts?: { replace?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams);

      if ("page" in patch) {
        if (patch.page == null) next.delete("page");
        else next.set("page", String(patch.page));
      }
      if ("pageSize" in patch) {
        if (patch.pageSize == null) next.delete("pageSize");
        else next.set("pageSize", String(patch.pageSize));
      }
      if ("q" in patch) {
        const v = (patch.q ?? "").trim();
        if (!v) next.delete("q");
        else next.set("q", v);
      }

      setSearchParams(next, { replace: opts?.replace ?? false });
    },
    [searchParams, setSearchParams],
  );

  // синхронизируем стейт <- URL (Back/Forward, открытие ссылки)
  useEffect(() => {
    const urlPage = parsePositiveInt(searchParams.get("page"), 1);
    const urlSize = parsePageSize(searchParams.get("pageSize"), 10);

    setCurrentPage((p) => (p === urlPage ? p : urlPage));
    setPageSize((s) => (s === urlSize ? s : urlSize));
  }, [searchParams]);

  const query = useInfiniteQuery<TanksPage, Error>({
    queryKey: TANKS_INFINITE_QUERY_KEY,
    queryFn: ({ pageParam = 1, signal }) => fetchTanksPage({ pageParam, signal }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.page_total ? lastPage.meta.page + 1 : undefined,
    staleTime: 60_000,
    useErrorBoundary: true,
    retry: false,
  });

  const totalItems = query.data?.pages?.[0]?.meta.total ?? 0;

  const allTanks = useMemo(() => {
    const flat = (query.data?.pages ?? []).flatMap((p) => p.items);
    return dedupeByTankIdKeepOrder(flat);
  }, [query.data?.pages]);

  const totalUiPages = useMemo(
    () => Math.max(1, Math.ceil((totalItems || 0) / pageSize)),
    [totalItems, pageSize],
  );

  // Clamp currentPage в допустимые границы [1..totalUiPages].
  // Это нужно, потому что totalUiPages может измениться (например, сменили pageSize,
  // изменился totalItems/мета, открыли URL с page=999 и т.п.).
  // Если страница стала невалидной — корректируем state и правим URL через replace
  // (replace, чтобы не засорять историю браузера лишними записями).
  useEffect(() => {
    //пока meta.total не пришёл — НЕ трогаем currentPage
    if (!query.data) return;

    const clamped = clamp(currentPage, 1, totalUiPages);
    if (clamped !== currentPage) {
      setCurrentPage(clamped);
      patchUrl({ page: clamped }, { replace: true });
    }
  }, [currentPage, totalUiPages, patchUrl, query.data]);

  //синхронизация невалидного pageSize в URL
  useEffect(() => {
    const urlPageSize = searchParams.get("pageSize");
    const parsed = parsePageSize(urlPageSize, 10);
    const isInvalid = urlPageSize !== null && String(parsed) !== urlPageSize;

    if (isInvalid) {
      patchUrl({ pageSize: parsed }, { replace: true });
    }
  }, [searchParams, patchUrl]);

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.max(1, Math.floor(page));
      setCurrentPage(() => nextPage);
      patchUrl({ page: nextPage });
    },
    [patchUrl],
  );

  const handlePageSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const nextSize = Number(e.target.value) as PaginationPageSize;

      setPageSize(() => nextSize);
      setCurrentPage(1);

      setFoundTankId(null);
      setFoundIndex(null);
      setNotFound(null);

      patchUrl({ pageSize: nextSize, page: 1 });
    },
    [patchUrl],
  );

  // ref на актуальный query — читаем внутри колбэка без deps
  const queryRef = useRef(query);
  queryRef.current = query;

  // ref-мьютекс: предотвращает повторный запуск пока цикл ещё не завершился
  const isEnsuringRef = useRef(false);

  // isSearching тоже через ref — чтобы ensureDataForUiPage
  // видел актуальное значение без deps
  const isSearchingRef = useRef(false);

  //  ленивая догрузка при пагинации
  const ensureDataForUiPage = useCallback(
    async (page: number, size: PaginationPageSize) => {
      // пока идёт поиск — не трогаем, searchExactAndSetPage сам всё загрузит
      if (isSearchingRef.current) return;
      if (isEnsuringRef.current) return;
      if (!totalItems) return;

      const q = queryRef.current;

      if (!q.data) return;
      if (!totalItems) return;
      if (q.isError) return;
      if (q.isFetchingNextPage) return;

      const targetCount = Math.min(page * size, totalItems);
      if (allTanks.length >= targetCount) return;

      const runId = ++ensureRunIdRef.current;
      isEnsuringRef.current = true;

      try {
        let pages = q.data.pages;
        let loadedCount = allTanks.length;

        while (loadedCount < targetCount) {
          if (ensureRunIdRef.current !== runId) return;

          const currentQ = queryRef.current;
          if (currentQ.isError) break;
          if (currentQ.isFetchingNextPage) break;

          const lastPage = pages[pages.length - 1];
          const hasMoreOnServer = lastPage.meta.page < lastPage.meta.page_total;
          if (!hasMoreOnServer) break;

          const res = await currentQ.fetchNextPage(); // без аргументов
          if (res.isError) break;

          pages = res.data?.pages ?? pages;

          loadedCount = dedupeByTankIdKeepOrder(pages.flatMap((p) => p.items)).length;
        }
      } finally {
        // освобождаем блок только если это ещё актуальный запуск
        if (ensureRunIdRef.current === runId) {
          isEnsuringRef.current = false;
        }
      }
    },
    [totalItems, allTanks.length],
  );

  useEffect(() => {
    void ensureDataForUiPage(currentPage, pageSize);
  }, [currentPage, pageSize, ensureDataForUiPage]);

  const rows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allTanks.slice(start, start + pageSize);
  }, [allTanks, currentPage, pageSize]);

  // обновляем URL ТОЛЬКО тут (по кнопке)
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

      // читаем через ref — query не в deps, не провоцируем пересоздание колбэка
      const q = queryRef.current;

      if (!q.data) return;
      if (isSearchingRef.current) return;

      // блокируем ensureDataForUiPage на время поиска
      isSearchingRef.current = true;

      setIsSearching(true);

      // отменяем текущий ensure-цикл если он вдруг шёл
      ++ensureRunIdRef.current;

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

    [patchUrl, pageSize],
  );

  const initialSearchDoneRef = useRef(false);
  //запускаем автопоиск при перезагрузке страницы
  useEffect(() => {
    if (initialSearchDoneRef.current) return;
    if (!qFromUrl) return;
    if (!query.data) return;

    initialSearchDoneRef.current = true;
    void searchExactAndSetPage(qFromUrl);
  }, [qFromUrl, query.data, searchExactAndSetPage]);

  const handleSearchClick = useCallback(
    (string: string) => () => {
      void searchExactAndSetPage(string);
    },
    [searchExactAndSetPage],
  );

  const handleSearchClear = useCallback(() => {
    setFoundTankId(null);
    setFoundIndex(null);
    setNotFound(null);

    setCurrentPage(1);
    patchUrl({ q: null, page: 1 });
  }, [patchUrl]);

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
