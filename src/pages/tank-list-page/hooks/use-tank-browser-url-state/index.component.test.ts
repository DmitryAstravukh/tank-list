import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Моки constants/utils
// --------------------
vi.mock("../../constants", () => ({
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 25,
}));

const parsePositiveIntMock = vi.fn((v: string | null, def: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : def;
});

const parsePageSizeMock = vi.fn((v: string | null, def: number) => {
  const allowed = new Set([10, 25, 50]);
  const n = Number(v);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return allowed.has(n) ? (n as any) : (def as any);
});

vi.mock("../../utils", () => ({
  parsePositiveInt: (v: string | null, def: number) => parsePositiveIntMock(v, def),
  parsePageSize: (v: string | null, def: number) => parsePageSizeMock(v, def),
}));

// --------------------
// Мок react-router-dom
// --------------------
let initialSearch = "";
let latestSetter: null | ((next: URLSearchParams, opts?: { replace?: boolean }) => void) = null;
const setSearchParamsSpy = vi.fn();

function setInitialSearchParams(search: string) {
  initialSearch = search;
}

function getLastSetCall() {
  const calls = setSearchParamsSpy.mock.calls;
  return calls.length ? calls[calls.length - 1] : undefined;
}

vi.mock("react-router-dom", async () => {
  // важно: используем React hooks внутри мока, это ок
  const React = await import("react");

  return {
    useSearchParams: () => {
      const [sp, setSp] = React.useState(() => new URLSearchParams(initialSearch));

      const setter = (next: URLSearchParams, opts?: { replace?: boolean }) => {
        setSearchParamsSpy(next, opts);
        // имитируем поведение роутера: searchParams меняется => ререндер
        setSp(new URLSearchParams(next));
      };

      latestSetter = setter;
      return [sp, setter] as const;
    },
  };
});

// --------------------
// Импорт хука (после моков!)
// --------------------
import { useTankBrowserUrlState } from "./index";

describe("useTankBrowserUrlState", () => {
  beforeEach(() => {
    setSearchParamsSpy.mockClear();
    parsePositiveIntMock.mockClear();
    parsePageSizeMock.mockClear();
    latestSetter = null;

    setInitialSearchParams("page=2&pageSize=25&q=tiger");
  });

  it("инициализирует currentPage/pageSize из URL и возвращает qFromUrl", () => {
    const { result } = renderHook(() => useTankBrowserUrlState());

    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.qFromUrl).toBe("tiger");

    // парсеры вызваны на старте
    expect(parsePositiveIntMock).toHaveBeenCalledWith("2", 1);
    expect(parsePageSizeMock).toHaveBeenCalledWith("25", 25);
  });

  it("patchUrl: ставит page/q, q тримится, replace прокидывается", async () => {
    const { result } = renderHook(() => useTankBrowserUrlState());

    act(() => {
      result.current.patchUrl({ page: 3, q: "  kv-1  " }, { replace: true });
    });

    const last = getLastSetCall();
    expect(last).toBeTruthy();

    const [nextParams, opts] = last!;
    expect(opts).toEqual({ replace: true });
    expect(nextParams).toBeInstanceOf(URLSearchParams);

    expect(nextParams.get("page")).toBe("3");
    expect(nextParams.get("pageSize")).toBe("25"); // сохранился существующий
    expect(nextParams.get("q")).toBe("kv-1");

    // qFromUrl берётся из URL => обновится после смены searchParams
    await waitFor(() => expect(result.current.qFromUrl).toBe("kv-1"));
    await waitFor(() => expect(result.current.currentPage).toBe(3));
  });

  it("patchUrl: удаляет параметры при null и удаляет q если пустой после trim", async () => {
    const { result } = renderHook(() => useTankBrowserUrlState());

    act(() => {
      result.current.patchUrl({ q: "   " }); // должен удалить q
    });

    await waitFor(() => {
      expect(result.current.searchParams.get("q")).toBe(null);
      expect(result.current.qFromUrl).toBe("");
    });

    act(() => {
      result.current.patchUrl({ page: null, pageSize: null, q: null });
    });

    await waitFor(() => {
      expect(result.current.searchParams.get("page")).toBe(null);
      expect(result.current.searchParams.get("pageSize")).toBe(null);
      expect(result.current.searchParams.get("q")).toBe(null);
    });

    // currentPage/pageSize должны перейти на дефолты после синка с URL
    await waitFor(() => expect(result.current.currentPage).toBe(1));
    await waitFor(() => expect(result.current.pageSize).toBe(25));
  });

  it("синхронизирует state <- URL при внешнем изменении searchParams (back/forward)", async () => {
    const { result } = renderHook(() => useTankBrowserUrlState());

    expect(latestSetter).toBeTypeOf("function");

    act(() => {
      latestSetter!(new URLSearchParams("page=10&pageSize=50&q=abc"), { replace: false });
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(10);
      expect(result.current.pageSize).toBe(50);
      expect(result.current.qFromUrl).toBe("abc");
    });
  });

  it("исправляет невалидный pageSize в URL через replace:true (например pageSize=999)", async () => {
    setInitialSearchParams("page=1&pageSize=999&q=tiger");

    const { result } = renderHook(() => useTankBrowserUrlState());

    // Должен сработать эффект-автофикс и вызвать setSearchParams с replace:true
    await waitFor(() => {
      expect(setSearchParamsSpy.mock.calls.length).toBeGreaterThan(0);
      const [params, opts] = getLastSetCall()!;
      expect(opts).toEqual({ replace: true });
      expect(params.get("pageSize")).toBe("25"); // по нашему мок-парсеру дефолт 25
    });

    // И состояние должно соответствовать исправленному URL
    await waitFor(() => {
      expect(result.current.pageSize).toBe(25);
      expect(result.current.searchParams.get("pageSize")).toBe("25");
    });
  });

  it("не делает replace, если pageSize отсутствует", async () => {
    setInitialSearchParams("page=2&q=tiger"); // pageSize нет

    renderHook(() => useTankBrowserUrlState());

    // Дадим эффектам шанс отработать
    await waitFor(() => {
      // при отсутствии pageSize auto-fix не должен вызываться
      // (но setSearchParamsSpy может вызываться в других кейсах — здесь не должен)
      expect(setSearchParamsSpy).toHaveBeenCalledTimes(0);
    });
  });
});
