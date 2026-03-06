import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchTanksPage, type TanksPage } from "../api";
import type { RequestedTank } from "../types";
import { useTanksBrowserController } from "./index";

vi.mock("../api", () => {
  return {
    fetchTanksPage: vi.fn(),
  };
});

const makeTank = (id: number, overrides?: Partial<RequestedTank>): RequestedTank => ({
  tank_id: id,
  name: "Tank " + id,
  tier: 5,
  type: "mediumTank",
  nation: "ussr",
  is_premium: false,
  price_credit: 100_000,
  ...overrides,
});

const makePage = (opts: {
  page: number;
  pageTotal: number;
  total: number;
  items: RequestedTank[];
}): TanksPage => ({
  meta: {
    page: opts.page,
    page_total: opts.pageTotal,
    total: opts.total,
    limit: 100,
    count: opts.items.length,
  },
  items: opts.items,
});

const makeTanks = (start: number, count: number): RequestedTank[] =>
  Array.from({ length: count }, (_, i) => makeTank(start + i));

const makeSelectEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLSelectElement>;

let queryClient: QueryClient;

const createWrapper = (initialEntries = ["/"]) => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );
};

describe("useTanksBrowserController", () => {
  const fetchMock = fetchTanksPage as unknown as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockResolvedValue: (v: any) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockImplementation: (fn: any) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockReset: () => any;
  };

  beforeEach(() => {
    // Маленький стабильный датасет: 30 элементов, всего 1 серверная страница.
    // Это важно, чтобы хук не пытался догружать 9-10 страниц в фоне.
    fetchMock.mockResolvedValue(
      makePage({
        page: 1,
        pageTotal: 1,
        total: 30,
        items: makeTanks(1, 30),
      }),
    );
  });

  afterEach(() => {
    queryClient.cancelQueries();
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("инициализируется значениями по умолчанию без параметров в URL", async () => {
    const { result, unmount } = renderHook(useTanksBrowserController, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.totalItems).toBe(30);
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.qFromUrl).toBe("");
    expect(result.current.rows).toHaveLength(10);
    expect(result.current.rows[0].tank_id).toBe(1);

    unmount();
  });

  it("читает page и pageSize из URL", async () => {
    const { result, unmount } = renderHook(useTanksBrowserController, {
      wrapper: createWrapper(["/?page=2&pageSize=20"]),
    });

    await waitFor(() => {
      expect(result.current.totalItems).toBe(30);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageSize).toBe(20);

    // page=2, pageSize=20 => элементы 21..30, всего 10
    expect(result.current.rows).toHaveLength(10);
    expect(result.current.rows[0].tank_id).toBe(21);

    unmount();
  });

  it("handlePageChange меняет текущую страницу", async () => {
    const { result, unmount } = renderHook(useTanksBrowserController, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.totalItems).toBe(30);
    });

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.rows).toHaveLength(10);
    expect(result.current.rows[0].tank_id).toBe(11);

    unmount();
  });

  it("handlePageSizeChange меняет размер страницы и сбрасывает currentPage на 1", async () => {
    const { result, unmount } = renderHook(useTanksBrowserController, {
      wrapper: createWrapper(["/?page=3&pageSize=10"]),
    });

    await waitFor(() => {
      expect(result.current.totalItems).toBe(30);
    });

    act(() => {
      result.current.handlePageSizeChange(makeSelectEvent("20"));
    });

    expect(result.current.pageSize).toBe(20);
    expect(result.current.currentPage).toBe(1);

    unmount();
  });

  it("автопоиск: если в URL есть q, находит танк и выставляет foundTankId", async () => {
    // В данных есть Tank 25
    const { result, unmount } = renderHook(useTanksBrowserController, {
      wrapper: createWrapper(["/?q=Tank 25"]),
    });

    await waitFor(() => {
      expect(result.current.totalItems).toBe(30);
    });

    await waitFor(() => {
      expect(result.current.foundTankId).toBe(25);
    });

    // pageSize=10 => Tank 25 на 3-й странице
    expect(result.current.currentPage).toBe(3);

    unmount();
  });
});
