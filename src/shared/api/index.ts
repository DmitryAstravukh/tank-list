import { QueryClient } from "@tanstack/react-query";

/**
 * Глобальный экземпляр {@link QueryClient} для управления кэшем React Query.
 *
 * Настроен для работы в режиме ручного управления запросами:
 * - Отключены автоматические повторные попытки при ошибках ({@link retry})
 * - Отключён авто-рефреш при фокусе окна ({@link refetchOnWindowFocus})
 * - Отключён авто-рефреш при восстановлении соединения ({@link refetchOnReconnect})
 *
 * @constant {QueryClient}
 *
 * @example
 * // Использование в QueryClientProvider
 * <QueryClientProvider client={queryClient}>
 *   <App />
 * </QueryClientProvider>
 *
 * @example
 * // Инвалидация кэша из любого компонента
 * import { queryClient } from './queryClient';
 *
 * queryClient.invalidateQueries({ queryKey: ['tanks'] });
 *
 * @see {@link https://tanstack.com/query/latest/docs/react/QueryClient} — Документация QueryClient
 * @see {@link https://tanstack.com/query/latest/docs/react/guides/query-invalidation} — Инвалидация кэша
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Количество повторных попыток при ошибке запроса.
       *
       * false — отключает автоматические retry.
       * Ошибки должны обрабатываться явно через {@link useQuery isError} или {@link ErrorBoundary}.
       *
       * @default false
       */
      retry: false,
      /**
       * Автоматический рефреш данных при фокусе окна браузера.
       *
       * false — отключает поведение. Данные не будут обновляться
       * при переключении между вкладками/окнами.
       *
       * @default false
       * @see {@link https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching}
       */
      refetchOnWindowFocus: false,
      /**
       * Автоматический рефреш данных при восстановлении сетевого соединения.
       *
       * false — отключает поведение. Данные не будут обновляться
       * после выхода из офлайн-режима.
       *
       * @default false
       * @see {@link https://tanstack.com/query/latest/docs/react/guides/network-mode}
       */
      refetchOnReconnect: false,
    },
  },
});
