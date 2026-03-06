import type React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useEnsureDataForUiPage } from "./index";
import { dedupeByTankIdKeepOrder } from "../../utils";
import type { PaginationPageSize } from "../../types";

vi.mock("../../utils", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dedupeByTankIdKeepOrder: vi.fn((items: any[]) => items),
}));

type Page = {
  meta: { page: number; page_total: number; total: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
};

type FetchNextPageResult = {
  isError: boolean;
  data?: { pages: Page[]; pageParams: unknown[] };
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useEnsureDataForUiPage", () => {
  const mockedDedupe = vi.mocked(dedupeByTankIdKeepOrder);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeItems(count: number, startId: number = 1) {
    return Array.from({ length: count }, (_, i) => ({
      tank_id: startId + i,
      name: "Tank " + String(startId + i),
    }));
  }

  function makePage(params: {
    page: number;
    page_total: number;
    total: number;
    itemsCount: number;
    itemsStartId?: number;
  }): Page {
    return {
      meta: { page: params.page, page_total: params.page_total, total: params.total },
      items: makeItems(params.itemsCount, params.itemsStartId ?? params.page * 1000),
    };
  }

  function makeQuery(params: {
    pages?: Page[];
    isError?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: ReturnType<typeof vi.fn<() => Promise<FetchNextPageResult>>>;
  }) {
    return {
      data: params.pages ? { pages: params.pages, pageParams: [] } : undefined,
      isError: Boolean(params.isError),
      isFetchingNextPage: Boolean(params.isFetchingNextPage),
      fetchNextPage:
        params.fetchNextPage ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (vi.fn<() => Promise<FetchNextPageResult>>(async () => ({ isError: false })) as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  it("ничего не делает, если isSearchingRef.current === true", async () => {
    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
      data: undefined,
    }));

    const query = makeQuery({
      pages: [makePage({ page: 1, page_total: 3, total: 30, itemsCount: 10 })],
      fetchNextPage,
    });

    const isSearchingRef = { current: true } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 10,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(result.current.isEnsuringRef.current).toBe(false);
  });

  it("ничего не делает, если totalItems === 0", async () => {
    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
    }));

    const query = makeQuery({
      pages: [makePage({ page: 1, page_total: 1, total: 0, itemsCount: 0 })],
      fetchNextPage,
    });

    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 0,
        allTanksLength: 0,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("ничего не делает, если query.data отсутствует", async () => {
    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
    }));

    const query = makeQuery({ pages: undefined, fetchNextPage });
    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 0,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("ничего не делает, если query.isError === true", async () => {
    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
    }));

    const query = makeQuery({
      pages: [makePage({ page: 1, page_total: 3, total: 30, itemsCount: 10 })],
      isError: true,
      fetchNextPage,
    });

    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 10,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("ничего не делает, если query.isFetchingNextPage === true", async () => {
    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
    }));

    const query = makeQuery({
      pages: [makePage({ page: 1, page_total: 3, total: 30, itemsCount: 10 })],
      isFetchingNextPage: true,
      fetchNextPage,
    });

    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 10,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("ничего не делает, если данных уже достаточно (allTanksLength >= targetCount)", async () => {
    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
    }));

    const query = makeQuery({
      pages: [makePage({ page: 1, page_total: 3, total: 30, itemsCount: 20 })],
      fetchNextPage,
    });

    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 20,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("догружает страницы, пока не наберёт targetCount (один fetchNextPage)", async () => {
    const p1 = makePage({ page: 1, page_total: 3, total: 30, itemsCount: 10, itemsStartId: 1 });
    const p2 = makePage({ page: 2, page_total: 3, total: 30, itemsCount: 10, itemsStartId: 11 });

    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
      data: { pages: [p1, p2], pageParams: [1, 2] },
    }));

    const query = makeQuery({ pages: [p1], fetchNextPage });
    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 10,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(mockedDedupe).toHaveBeenCalled();
    expect(result.current.isEnsuringRef.current).toBe(false);
  });

  it("останавливается, если на сервере больше нет страниц (page_total достигнут)", async () => {
    const p1 = makePage({ page: 1, page_total: 1, total: 30, itemsCount: 10, itemsStartId: 1 });

    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(async () => ({
      isError: false,
      data: { pages: [p1], pageParams: [1] },
    }));

    const query = makeQuery({ pages: [p1], fetchNextPage });
    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 30,
        allTanksLength: 10,
        isSearchingRef,
      }),
    );

    await result.current.ensureDataForUiPage(3, 10 as PaginationPageSize);

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(result.current.isEnsuringRef.current).toBe(false);
  });

  it("не запускает параллельные ensure-циклы (mutex isEnsuringRef)", async () => {
    const p1 = makePage({ page: 1, page_total: 10, total: 100, itemsCount: 10, itemsStartId: 1 });
    const p2 = makePage({ page: 2, page_total: 10, total: 100, itemsCount: 10, itemsStartId: 11 });

    const d = deferred<FetchNextPageResult>();

    const fetchNextPage = vi.fn<() => Promise<FetchNextPageResult>>(() => d.promise);

    const query = makeQuery({ pages: [p1], fetchNextPage });
    const isSearchingRef = { current: false } as React.MutableRefObject<boolean>;

    const { result } = renderHook(() =>
      useEnsureDataForUiPage({
        query,
        totalItems: 100,
        allTanksLength: 10,
        isSearchingRef,
      }),
    );

    const pA = result.current.ensureDataForUiPage(2, 10 as PaginationPageSize);
    const pB = result.current.ensureDataForUiPage(3, 10 as PaginationPageSize);

    // второй вызов должен выйти сразу, не увеличивая fetchNextPage
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
    expect(result.current.isEnsuringRef.current).toBe(true);

    // завершаем первый fetchNextPage
    d.resolve({ isError: false, data: { pages: [p1, p2], pageParams: [1, 2] } });

    await Promise.all([pA, pB]);

    expect(result.current.isEnsuringRef.current).toBe(false);
  });
});
