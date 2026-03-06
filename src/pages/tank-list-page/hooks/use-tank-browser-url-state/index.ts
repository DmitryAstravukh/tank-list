import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { PaginationPageSize } from "../../types";
import { parsePageSize, parsePositiveInt } from "../../utils";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../../constants";

export type PatchUrlFn = (
  patch: { page?: number | null; pageSize?: PaginationPageSize | null; q?: string | null },
  opts?: { replace?: boolean },
) => void;

/**
 * Хук для управления URL-синхронизированными параметрами списка танков.
 *
 * Управляет параметрами query-строки (search params):
 * - page — номер страницы (положительное целое)
 * - pageSize — размер страницы (значение из допустимого набора)
 * - q — поисковый запрос (в коде возвращается как qFromUrl)
 *
 * Что делает:
 * 1) Инициализирует локальные стейты currentPage и pageSize из URL, используя парсеры:
 *    - parsePositiveInt(..., DEFAULT_PAGE)
 *    - parsePageSize(..., DEFAULT_PAGE_SIZE)
 * 2) Даёт функцию `patchUrl` для точечного обновления параметров URL
 *    (с удалением параметров при null и trim/очисткой q).
 * 3) Поддерживает синхронизацию state <- URL:
 *    если URL меняется извне (back/forward, открытие ссылки), стейты обновляются.
 * 4) Автоматически исправляет невалидный pageSize в URL через replace,
 *    чтобы не захламлять историю браузера.
 *
 * Важно:
 * - qFromUrl берётся напрямую из URL (searchParams.get("q") ?? "") и не хранится в state.
 *
 * @returns Объект управления URL и стейтом:
 * - searchParams — текущие URLSearchParams
 * - qFromUrl — текущий поисковый запрос из URL (или пустая строка)
 * - currentPage, setCurrentPage — локальный стейт страницы
 * - pageSize, setPageSize — локальный стейт размера страницы
 * - patchUrl — функция патча query-параметров
 *
 * @example
 * const {
 *   qFromUrl,
 *   currentPage,
 *   pageSize,
 *   patchUrl,
 * } = useTankBrowserUrlState();
 *
 * // обновить поиск и сбросить страницу
 * patchUrl({ q: "tiger", page: 1 });
 *
 * // очистить поиск
 * patchUrl({ q: null });
 *
 * // установить pageSize (и удалить page чтобы вернуться на дефолт)
 * patchUrl({ pageSize: 50, page: null });
 */
export const useTankBrowserUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState<number>(() =>
    parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE),
  );

  const [pageSize, setPageSize] = useState<PaginationPageSize>(() =>
    parsePageSize(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
  );

  const qFromUrl = searchParams.get("q") ?? "";

  const patchUrl = useCallback<PatchUrlFn>(
    (patch, opts) => {
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

  // синхронизуем URL и стейты
  useEffect(() => {
    const urlPage = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
    const urlSize = parsePageSize(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage((p) => (p === urlPage ? p : urlPage));
    setPageSize((s) => (s === urlSize ? s : urlSize));
  }, [searchParams]);

  // replace невалидного pageSize в URL (например pageSize=999)
  useEffect(() => {
    const urlPageSize = searchParams.get("pageSize");
    const parsed = parsePageSize(urlPageSize, DEFAULT_PAGE_SIZE);
    const isInvalid = urlPageSize !== null && String(parsed) !== urlPageSize;

    if (isInvalid) {
      patchUrl({ pageSize: parsed }, { replace: true });
    }
  }, [searchParams, patchUrl]);

  return {
    searchParams,
    qFromUrl,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    patchUrl,
  };
};
