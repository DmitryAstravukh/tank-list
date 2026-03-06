import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

import { useTankExactSearch } from "./index";
import type { PatchUrlFn } from "../use-tank-browser-url-state";

// Мокаем утилиты, чтобы тесты были полностью unit и управляемые
vi.mock("../../utils", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dedupeByTankIdKeepOrder: vi.fn((items: any[]) => items),
}));

vi.mock("../../utils/normalize-for-search", () => ({
  normalizeForSearch: vi.fn((v: string) => (v ?? "").trim().toLowerCase()),
}));

import { dedupeByTankIdKeepOrder } from "../../utils";
import { normalizeForSearch } from "../../utils/normalize-for-search";

type Tank = { tank_id: number; name: string };
type Page = { items: Tank[]; meta: { page: number; page_total: number; total: number } };

describe("useTankExactSearch", () => {
  const mockedDedupe = vi.mocked(dedupeByTankIdKeepOrder);
  const mockedNormalize = vi.mocked(normalizeForSearch);

  let patchUrl: ReturnType<typeof vi.fn<PatchUrlFn>>;
  let setCurrentPage: ReturnType<typeof vi.fn<(p: number) => void>>;
  let cancelEnsure: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.clearAllMocks();

    patchUrl = vi.fn<PatchUrlFn>();
    setCurrentPage = vi.fn<(p: number) => void>();
    cancelEnsure = vi.fn<() => void>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedDedupe.mockImplementation((items: any[]) => items);
    mockedNormalize.mockImplementation((v: string) => (v ?? "").trim().toLowerCase());
  });

  function makePage(pageNum: number, pageTotal: number, total: number, items: Tank[]): Page {
    return {
      items,
      meta: { page: pageNum, page_total: pageTotal, total },
    };
  }

  function makeQuery(params: {
    pages?: Page[];
    isError?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchNextPage?: () => Promise<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): UseInfiniteQueryResult<any, Error> {
    const pages = params.pages;
    const isError = params.isError ?? false;

    return {
      data: pages ? { pages, pageParams: [] } : undefined,
      isError,
      fetchNextPage: (params.fetchNextPage ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.fn(async () => ({ isError: false, data: undefined }))) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  it("возвращает начальные значения состояния", () => {
    const query = makeQuery({ pages: [makePage(1, 1, 2, [{ tank_id: 1, name: "Tiger" }])] });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    expect(result.current.foundTankId).toBe(null);
    expect(result.current.foundIndex).toBe(null);
    expect(result.current.notFound).toBe(null);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.isSearchingRef.current).toBe(false);
  });

  it("resetSearchState сбрасывает notFound (и прочее) в null", () => {
    const query = makeQuery({ pages: [makePage(1, 1, 1, [{ tank_id: 1, name: "Tiger" }])] });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    act(() => {
      result.current.setNotFound("abc");
    });

    expect(result.current.notFound).toBe("abc");

    act(() => {
      result.current.resetSearchState();
    });

    expect(result.current.notFound).toBe(null);
    expect(result.current.foundTankId).toBe(null);
    expect(result.current.foundIndex).toBe(null);
  });

  it("если raw после normalize пустой: patchUrl({ q: null, page: 1 }) и выход без cancelEnsure", async () => {
    const query = makeQuery({ pages: [makePage(1, 1, 1, [{ tank_id: 1, name: "Tiger" }])] });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("   ");
    });

    expect(patchUrl).toHaveBeenCalledTimes(1);
    expect(patchUrl).toHaveBeenCalledWith({ q: null, page: 1 });

    expect(cancelEnsure).not.toHaveBeenCalled();
    expect(setCurrentPage).not.toHaveBeenCalled();
  });

  it("если query.data нет: поиск не запускается и ничего не вызывает", async () => {
    const query = makeQuery({ pages: undefined });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("tiger");
    });

    expect(cancelEnsure).not.toHaveBeenCalled();
    expect(patchUrl).not.toHaveBeenCalled();
    expect(setCurrentPage).not.toHaveBeenCalled();
    expect(result.current.isSearching).toBe(false);
  });

  it("если найдено в уже загруженных страницах: выставляет foundTankId/foundIndex, setCurrentPage и patchUrl", async () => {
    const pages = [
      makePage(1, 1, 2, [
        { tank_id: 1, name: "Tiger I" },
        { tank_id: 2, name: "Panther" },
      ]),
    ];

    const query = makeQuery({ pages });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("  TIGER I  ");
    });

    expect(cancelEnsure).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.foundTankId).toBe(1);
      expect(result.current.foundIndex).toBe(0);
    });

    expect(setCurrentPage).toHaveBeenCalledWith(1);
    expect(patchUrl).toHaveBeenCalledWith({ q: "TIGER I".trim(), page: 1 });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.isSearchingRef.current).toBe(false);
  });

  it("если найдено только после fetchNextPage: догружает, находит, вычисляет uiPage и патчит URL", async () => {
    // pageSize = 2
    // после догрузки items будут: [A, B, C, TARGET]
    // idx(TARGET)=3 => uiPage=floor(3/2)+1=2
    const page1 = makePage(1, 2, 4, [
      { tank_id: 1, name: "A" },
      { tank_id: 2, name: "B" },
    ]);

    const page2 = makePage(2, 2, 4, [
      { tank_id: 3, name: "C" },
      { tank_id: 4, name: "target" },
    ]);

    const fetchNextPage = vi.fn(async () => ({
      isError: false,
      data: { pages: [page1, page2], pageParams: [1, 2] },
    }));

    const query = makeQuery({
      pages: [page1],
      fetchNextPage,
    });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 2 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("TARGET");
    });

    expect(cancelEnsure).toHaveBeenCalledTimes(1);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.foundTankId).toBe(4);
      expect(result.current.foundIndex).toBe(3);
    });

    expect(setCurrentPage).toHaveBeenCalledWith(2);
    expect(patchUrl).toHaveBeenCalledWith({ q: "TARGET".trim(), page: 2 });
  });

  it("если не найдено: догружает до конца и выставляет notFound + patchUrl({ q, page: 1 })", async () => {
    const page1 = makePage(1, 3, 3, [{ tank_id: 1, name: "A" }]);
    const page2 = makePage(2, 3, 3, [{ tank_id: 2, name: "B" }]);
    const page3 = makePage(3, 3, 3, [{ tank_id: 3, name: "C" }]);

    const fetchNextPage = vi
      .fn()
      .mockResolvedValueOnce({
        isError: false,
        data: { pages: [page1, page2], pageParams: [1, 2] },
      })
      .mockResolvedValueOnce({
        isError: false,
        data: { pages: [page1, page2, page3], pageParams: [1, 2, 3] },
      });

    const query = makeQuery({
      pages: [page1],
      fetchNextPage,
    });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("  ZZZ  ");
    });

    expect(cancelEnsure).toHaveBeenCalledTimes(1);
    expect(fetchNextPage).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(result.current.notFound).toBe("ZZZ");
    });

    expect(result.current.foundTankId).toBe(null);
    expect(result.current.foundIndex).toBe(null);

    expect(setCurrentPage).not.toHaveBeenCalled();
    expect(patchUrl).toHaveBeenCalledWith({ q: "ZZZ", page: 1 });
  });

  it("если isSearchingRef.current уже true: повторный запуск игнорируется", async () => {
    const page1 = makePage(1, 2, 2, [{ tank_id: 1, name: "A" }]);
    const fetchNextPage = vi.fn(async () => ({
      isError: false,
      data: { pages: [page1], pageParams: [1] },
    }));

    const query = makeQuery({
      pages: [page1],
      fetchNextPage,
    });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    act(() => {
      result.current.isSearchingRef.current = true;
    });

    await act(async () => {
      await result.current.searchExactAndSetPage("A");
    });

    expect(cancelEnsure).not.toHaveBeenCalled();
    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(patchUrl).not.toHaveBeenCalled();
    expect(setCurrentPage).not.toHaveBeenCalled();
  });

  it("handleSearchClick возвращает функцию, которая запускает поиск", async () => {
    const pages = [makePage(1, 1, 1, [{ tank_id: 10, name: "t-34" }])];
    const query = makeQuery({ pages });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      // каррированный обработчик
      await result.current.handleSearchClick("  T-34  ")();
    });

    await waitFor(() => {
      expect(result.current.foundTankId).toBe(10);
    });

    expect(patchUrl).toHaveBeenCalledWith({ q: "T-34", page: 1 });
  });

  it("вызывает dedupeByTankIdKeepOrder при каждом пересчёте items", async () => {
    const page1 = makePage(1, 1, 2, [
      { tank_id: 1, name: "A" },
      { tank_id: 2, name: "B" },
    ]);

    const query = makeQuery({ pages: [page1] });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("A");
    });

    // Минимум один раз (до while)
    expect(mockedDedupe).toHaveBeenCalled();
  });

  it("использует normalizeForSearch для raw и для сравнения имён", async () => {
    const page1 = makePage(1, 1, 1, [{ tank_id: 1, name: "Tiger I" }]);
    const query = makeQuery({ pages: [page1] });

    const { result } = renderHook(() =>
      useTankExactSearch({
        query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSize: 10 as any,
        patchUrl,
        setCurrentPage,
        cancelEnsure,
      }),
    );

    await act(async () => {
      await result.current.searchExactAndSetPage("TIGER I");
    });

    // normalizeForSearch вызывается для raw и для t.name
    expect(mockedNormalize).toHaveBeenCalled();
  });
});
