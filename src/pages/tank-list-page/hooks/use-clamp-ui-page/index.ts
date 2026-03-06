import { useEffect } from "react";
import { clamp } from "../../utils";
import type { PatchUrlFn } from "../use-tank-browser-url-state";

/**
 * Хук для ограничения (clamp) текущей страницы в допустимый диапазон [1..totalUiPages].
 *
 * Зачем нужен:
 * - totalUiPages может измениться (смена pageSize, изменение totalItems, открытие URL с page=999).
 * - Если currentPage стал невалидным (вне диапазона), хук исправляет state и URL.
 *
 * Поведение:
 * - Ничего не делает, пока queryHasData === false (данные ещё не пришли).
 * - Если currentPage < 1 → устанавливает 1.
 * - Если currentPage > totalUiPages → устанавливает totalUiPages.
 * - При исправлении вызывает setCurrentPage и patchUrl с replace: true
 *   (чтобы не засорять историю браузера).
 *
 * @param params.queryHasData - Флаг наличия данных (query.data !== undefined).
 * @param params.currentPage - Текущая страница (1-based).
 * @param params.totalUiPages - Максимальное количество UI-страниц.
 * @param params.setCurrentPage - Сеттер состояния текущей страницы.
 * @param params.patchUrl - Функция для обновления URL-параметров.
 */
export const useClampUiPage = (params: {
  queryHasData: boolean;
  currentPage: number;
  totalUiPages: number;
  setCurrentPage: (p: number) => void;
  patchUrl: PatchUrlFn;
}) => {
  const { queryHasData, currentPage, totalUiPages, setCurrentPage, patchUrl } = params;

  useEffect(() => {
    if (!queryHasData) return;

    const clamped = clamp(currentPage, 1, totalUiPages);
    if (clamped !== currentPage) {
      setCurrentPage(clamped);
      patchUrl({ page: clamped }, { replace: true });
    }
  }, [queryHasData, currentPage, totalUiPages, setCurrentPage, patchUrl]);
};
