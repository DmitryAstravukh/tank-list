import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useTanksInfiniteData } from "./index";
import { dedupeByTankIdKeepOrder } from "../../utils";

vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: vi.fn(),
}));

vi.mock("../../api", () => ({
  fetchTanksPage: vi.fn(),
}));

vi.mock("../../constants", () => ({
  TANKS_INFINITE_QUERY_KEY: ["tanks", "infinite"],
  TANK_STALE_TIME: 60000,
}));

vi.mock("../../utils", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dedupeByTankIdKeepOrder: vi.fn((items: any[]) => items),
}));

describe("useTanksInfiniteData", () => {
  const mockedUseInfiniteQuery = vi.mocked(useInfiniteQuery);
  const mockedDedupe = vi.mocked(dedupeByTankIdKeepOrder);

  beforeEach(() => {
    vi.clearAllMocks();
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function page(meta: { page: number; page_total: number; total: number }, items: any[] = []) {
    return { meta, items };
  }

  it("возвращает query объект из useInfiniteQuery", () => {
    const mockQuery = {
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseInfiniteQuery.mockReturnValue(mockQuery as any);

    const { result } = renderHook(() => useTanksInfiniteData());

    expect(result.current.query).toBe(mockQuery);
  });

  it("totalItems = 0, если query.data отсутствует", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseInfiniteQuery.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useTanksInfiniteData());

    expect(result.current.totalItems).toBe(0);
  });

  it("totalItems = 0, если pages пустой", () => {
    mockedUseInfiniteQuery.mockReturnValue({
      data: { pages: [], pageParams: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useTanksInfiniteData());

    expect(result.current.totalItems).toBe(0);
  });

  it("totalItems берётся из meta.total первой страницы", () => {
    mockedUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [page({ page: 1, page_total: 5, total: 123 }, [{ tank_id: 1, name: "Tiger I" }])],
        pageParams: [1],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useTanksInfiniteData());

    expect(result.current.totalItems).toBe(123);
  });

  it("allTanks = [] при отсутствии данных (dedupe вызывается с [])", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseInfiniteQuery.mockReturnValue({ data: undefined } as any);

    const { result } = renderHook(() => useTanksInfiniteData());

    expect(result.current.allTanks).toEqual([]);
    expect(mockedDedupe).toHaveBeenCalledTimes(1);
    expect(mockedDedupe).toHaveBeenCalledWith([]);
  });

  it("делает flat всех страниц и передаёт в dedupeByTankIdKeepOrder", () => {
    const tank1 = { tank_id: 1, name: "Tiger I" };
    const tank2 = { tank_id: 2, name: "Panther" };
    const tank3 = { tank_id: 3, name: "T-34" };

    mockedUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          page({ page: 1, page_total: 2, total: 3 }, [tank1, tank2]),
          page({ page: 2, page_total: 2, total: 3 }, [tank3]),
        ],
        pageParams: [1, 2],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockedDedupe.mockReturnValue([tank1, tank2, tank3]);

    const { result } = renderHook(() => useTanksInfiniteData());

    expect(mockedDedupe).toHaveBeenCalledWith([tank1, tank2, tank3]);
    expect(result.current.allTanks).toEqual([tank1, tank2, tank3]);
  });

  it("getNextPageParam возвращает следующую страницу, если есть ещё", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseInfiniteQuery.mockReturnValue({ data: undefined } as any);

    renderHook(() => useTanksInfiniteData());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = mockedUseInfiniteQuery.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getNextPageParam = options.getNextPageParam as (lastPage: any) => number | undefined;

    const lastPage = page({ page: 2, page_total: 5, total: 100 }, []);
    expect(getNextPageParam(lastPage)).toBe(3);
  });

  it("getNextPageParam возвращает undefined, если это последняя страница", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseInfiniteQuery.mockReturnValue({ data: undefined } as any);

    renderHook(() => useTanksInfiniteData());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = mockedUseInfiniteQuery.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getNextPageParam = options.getNextPageParam as (lastPage: any) => number | undefined;

    const lastPage = page({ page: 5, page_total: 5, total: 100 }, []);
    expect(getNextPageParam(lastPage)).toBeUndefined();
  });

  it("вызывает useInfiniteQuery с ожидаемыми опциями (queryKey/staleTime/useErrorBoundary)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedUseInfiniteQuery.mockReturnValue({ data: undefined } as any);

    renderHook(() => useTanksInfiniteData());

    expect(mockedUseInfiniteQuery).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = mockedUseInfiniteQuery.mock.calls[0][0];

    expect(options.queryKey).toEqual(["tanks", "infinite"]);
    expect(options.staleTime).toBe(60000);
    expect(options.useErrorBoundary).toBe(true);
    expect(typeof options.queryFn).toBe("function");
    expect(typeof options.getNextPageParam).toBe("function");
  });

  it("allTanks пересчитывается при изменении pages (rerender)", () => {
    const tank1 = { tank_id: 1, name: "Tiger I" };
    const tank2 = { tank_id: 2, name: "Panther" };

    const page1 = page({ page: 1, page_total: 2, total: 2 }, [tank1]);
    const page2 = page({ page: 2, page_total: 2, total: 2 }, [tank2]);

    mockedUseInfiniteQuery.mockReturnValue({
      data: { pages: [page1], pageParams: [1] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockedDedupe.mockReturnValue([tank1]);

    const { result, rerender } = renderHook(() => useTanksInfiniteData());
    expect(result.current.allTanks).toEqual([tank1]);

    mockedUseInfiniteQuery.mockReturnValue({
      data: { pages: [page1, page2], pageParams: [1, 2] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockedDedupe.mockReturnValue([tank1, tank2]);

    rerender();

    expect(result.current.allTanks).toEqual([tank1, tank2]);
  });
});
