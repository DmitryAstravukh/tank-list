import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Моки констант
// --------------------
vi.mock("../../constants", () => ({
  DEFAULT_PAGE: 1,
  SERVER_LIMIT: 1000,
}));

// --------------------
// Спаи для дочерних хуков
// --------------------
const useTankBrowserUrlStateMock = vi.fn();
const useTanksInfiniteDataMock = vi.fn();
const useClampUiPageMock = vi.fn();
const useEnsureDataForUiPageMock = vi.fn();
const useTankExactSearchMock = vi.fn();
const useInitialSearchFromUrlMock = vi.fn();

// --------------------
// Мокаем модули (ровно как в useTanks.ts)
// --------------------
vi.mock("../use-tank-browser-url-state", () => ({
  useTankBrowserUrlState: () => useTankBrowserUrlStateMock(),
}));

vi.mock("../use-tank-infinite-data", () => ({
  useTanksInfiniteData: () => useTanksInfiniteDataMock(),
}));

vi.mock("../use-clamp-ui-page", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useClampUiPage: (args: any) => useClampUiPageMock(args),
}));

vi.mock("../use-ensure-data-for-ui-page", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEnsureDataForUiPage: (args: any) => useEnsureDataForUiPageMock(args),
}));

vi.mock("../use-tank-exact-search", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useTankExactSearch: (args: any) => useTankExactSearchMock(args),
}));

vi.mock("../use-initial-search-from-url", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useInitialSearchFromUrl: (args: any) => useInitialSearchFromUrlMock(args),
}));

// --------------------
// Импорт хука — после моков!
// --------------------
import { useTanks } from "./index";

function makeTanks(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Tank ${i + 1}` }));
}

describe("useTanks", () => {
  // Переменные, которыми удобно управлять между тестами/ререндерами
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let urlState: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let infiniteData: any;

  let ensureDataForUiPageSpy: ReturnType<typeof vi.fn>;
  let cancelEnsureSpy: ReturnType<typeof vi.fn>;

  let patchUrlSpy: ReturnType<typeof vi.fn>;
  let setCurrentPageSpy: ReturnType<typeof vi.fn>;
  let setPageSizeSpy: ReturnType<typeof vi.fn>;

  let searchExactAndSetPageSpy: ReturnType<typeof vi.fn>;
  let handleSearchClickSpy: ReturnType<typeof vi.fn>;
  let resetSearchStateSpy: ReturnType<typeof vi.fn>;
  let setNotFoundSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    patchUrlSpy = vi.fn();
    setCurrentPageSpy = vi.fn();
    setPageSizeSpy = vi.fn();

    urlState = {
      qFromUrl: "tiger",
      currentPage: 2,
      setCurrentPage: setCurrentPageSpy,
      pageSize: 25,
      setPageSize: setPageSizeSpy,
      patchUrl: patchUrlSpy,
    };

    infiniteData = {
      query: { data: { pages: [] } },
      totalItems: 123,
      allTanks: makeTanks(80),
    };

    ensureDataForUiPageSpy = vi.fn(() => Promise.resolve());
    cancelEnsureSpy = vi.fn();

    searchExactAndSetPageSpy = vi.fn(() => Promise.resolve());
    handleSearchClickSpy = vi.fn(() => Promise.resolve());
    resetSearchStateSpy = vi.fn();
    setNotFoundSpy = vi.fn();

    useTankBrowserUrlStateMock.mockImplementation(() => urlState);
    useTanksInfiniteDataMock.mockImplementation(() => infiniteData);

    useEnsureDataForUiPageMock.mockImplementation((args) => ({
      ensureDataForUiPage: ensureDataForUiPageSpy,
      cancelEnsure: cancelEnsureSpy,
      __args: args, // иногда удобно отлаживать
    }));

    useTankExactSearchMock.mockImplementation((args) => ({
      searchExactAndSetPage: searchExactAndSetPageSpy,
      handleSearchClick: handleSearchClickSpy,
      resetSearchState: resetSearchStateSpy,
      foundTankId: 777,
      foundIndex: 12,
      isSearching: false,
      notFound: null,
      setNotFound: setNotFoundSpy,
      __args: args,
    }));
  });

  it("возвращает публичные поля (qFromUrl, paging, totals, flags, limits)", () => {
    const { result } = renderHook(() => useTanks());

    expect(result.current.qFromUrl).toBe("tiger");
    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.totalItems).toBe(123);

    expect(result.current.isSearching).toBe(false);
    expect(result.current.notFound).toBe(null);

    expect(result.current.loadedCount).toBe(80);
    expect(result.current.serverLimit).toBe(1000);

    expect(result.current.foundTankId).toBe(777);
    expect(result.current.foundIndex).toBe(12);
  });

  it("вычисляет rows как slice(allTanks) под текущую страницу", () => {
    // currentPage=2, pageSize=25 => start=25 => элементы 26..50
    const { result } = renderHook(() => useTanks());

    expect(result.current.rows).toHaveLength(25);
    expect(result.current.rows[0]).toEqual({ id: 26, name: "Tank 26" });
    expect(result.current.rows[24]).toEqual({ id: 50, name: "Tank 50" });
  });

  it("вызывает useClampUiPage с корректными аргументами (totalUiPages, queryHasData и т.п.)", () => {
    renderHook(() => useTanks());

    expect(useClampUiPageMock).toHaveBeenCalledTimes(1);
    const args = useClampUiPageMock.mock.calls[0][0];

    // totalUiPages = ceil(123/25)=5
    expect(args).toMatchObject({
      queryHasData: true,
      currentPage: 2,
      totalUiPages: 5,
      setCurrentPage: setCurrentPageSpy,
      patchUrl: patchUrlSpy,
    });
  });

  it("вызывает ensureDataForUiPage(currentPage, pageSize) на маунт", async () => {
    renderHook(() => useTanks());

    await waitFor(() => {
      expect(ensureDataForUiPageSpy).toHaveBeenCalled();
    });

    const last = ensureDataForUiPageSpy.mock.calls.at(-1);
    expect(last).toEqual([2, 25]);
  });

  it("повторно вызывает ensureDataForUiPage при смене currentPage/pageSize (через обновление urlState + rerender)", async () => {
    const { rerender } = renderHook(() => useTanks());

    await waitFor(() => expect(ensureDataForUiPageSpy).toHaveBeenCalled());
    ensureDataForUiPageSpy.mockClear();

    // имитируем внешний апдейт url state (например, URL изменился)
    urlState = { ...urlState, currentPage: 3, pageSize: 50 };
    rerender();

    await waitFor(() => {
      expect(ensureDataForUiPageSpy).toHaveBeenCalled();
    });

    const last = ensureDataForUiPageSpy.mock.calls.at(-1);
    expect(last).toEqual([3, 50]);
  });

  it("передаёт в useInitialSearchFromUrl qFromUrl, queryHasData и searchExactAndSetPage", () => {
    renderHook(() => useTanks());

    expect(useInitialSearchFromUrlMock).toHaveBeenCalledTimes(1);
    const args = useInitialSearchFromUrlMock.mock.calls[0][0];

    expect(args.qFromUrl).toBe("tiger");
    expect(args.queryHasData).toBe(true);
    expect(args.searchExactAndSetPage).toBe(searchExactAndSetPageSpy);
  });

  it("handlePageChange: нормализует страницу (floor + min=1), вызывает setCurrentPage и patchUrl", () => {
    const { result } = renderHook(() => useTanks());

    act(() => {
      result.current.handlePageChange(3.9);
    });

    expect(setCurrentPageSpy).toHaveBeenCalledWith(3);
    expect(patchUrlSpy).toHaveBeenCalledWith({ page: 3 });

    act(() => {
      result.current.handlePageChange(-10);
    });

    expect(setCurrentPageSpy).toHaveBeenCalledWith(1);
    expect(patchUrlSpy).toHaveBeenCalledWith({ page: 1 });
  });

  it("handlePageSizeChange: выставляет pageSize, сбрасывает страницу на DEFAULT_PAGE, ресетит поиск и notFound, патчит URL", () => {
    const { result } = renderHook(() => useTanks());

    act(() => {
      result.current.handlePageSizeChange({
        target: { value: "50" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    expect(setPageSizeSpy).toHaveBeenCalledWith(50);
    expect(setCurrentPageSpy).toHaveBeenCalledWith(1);

    expect(resetSearchStateSpy).toHaveBeenCalledTimes(1);
    expect(setNotFoundSpy).toHaveBeenCalledWith(null);

    expect(patchUrlSpy).toHaveBeenCalledWith({ pageSize: 50, page: 1 });
  });

  it("handleSearchClear: resetSearchState + setCurrentPage(DEFAULT_PAGE) + patchUrl({q:null, page:DEFAULT_PAGE})", () => {
    const { result } = renderHook(() => useTanks());

    act(() => {
      result.current.handleSearchClear();
    });

    expect(resetSearchStateSpy).toHaveBeenCalledTimes(1);
    expect(setCurrentPageSpy).toHaveBeenCalledWith(1);
    expect(patchUrlSpy).toHaveBeenCalledWith({ q: null, page: 1 });
  });

  it("пробрасывает handleSearchClick из search-хука как есть", () => {
    const { result } = renderHook(() => useTanks());
    expect(result.current.handleSearchClick).toBe(handleSearchClickSpy);
  });

  it("queryHasData=false: useClampUiPage и useInitialSearchFromUrl получают queryHasData=false", () => {
    infiniteData = { ...infiniteData, query: { data: null } };
    useTanksInfiniteDataMock.mockImplementation(() => infiniteData);

    renderHook(() => useTanks());

    expect(useClampUiPageMock).toHaveBeenCalledTimes(1);
    expect(useClampUiPageMock.mock.calls[0][0].queryHasData).toBe(false);

    expect(useInitialSearchFromUrlMock).toHaveBeenCalledTimes(1);
    expect(useInitialSearchFromUrlMock.mock.calls[0][0].queryHasData).toBe(false);
  });

  it("totalUiPages минимум 1 (если totalItems=0/undefined)", () => {
    infiniteData = { ...infiniteData, totalItems: 0 };
    useTanksInfiniteDataMock.mockImplementation(() => infiniteData);

    renderHook(() => useTanks());

    const clampArgs = useClampUiPageMock.mock.calls[0][0];
    expect(clampArgs.totalUiPages).toBe(1);
  });
});
