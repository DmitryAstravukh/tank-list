import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInitialSearchFromUrl } from "./index";

describe("useInitialSearchFromUrl", () => {
  let searchExactAndSetPage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    searchExactAndSetPage = vi.fn(() => Promise.resolve());
  });

  it("не вызывает searchExactAndSetPage, если qFromUrl пустой", async () => {
    renderHook(() =>
      useInitialSearchFromUrl({
        qFromUrl: "",
        queryHasData: true,
        searchExactAndSetPage,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );

    // эффект отрабатывает асинхронно — подождём “тик”
    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(0);
    });
  });

  it("не вызывает searchExactAndSetPage, если queryHasData=false", async () => {
    renderHook(() =>
      useInitialSearchFromUrl({
        qFromUrl: "tiger",
        queryHasData: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(0);
    });
  });

  it("вызывает searchExactAndSetPage, если qFromUrl задан и queryHasData=true", async () => {
    renderHook(() =>
      useInitialSearchFromUrl({
        qFromUrl: "tiger",
        queryHasData: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(1);
      expect(searchExactAndSetPage).toHaveBeenCalledWith("tiger");
    });
  });

  it("ждёт появления данных: вызывает поиск когда queryHasData меняется false -> true", async () => {
    const { rerender } = renderHook(
      (props: { qFromUrl: string; queryHasData: boolean }) =>
        useInitialSearchFromUrl({
          qFromUrl: props.qFromUrl,
          queryHasData: props.queryHasData,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      {
        initialProps: { qFromUrl: "tiger", queryHasData: false },
      },
    );

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(0);
    });

    rerender({ qFromUrl: "tiger", queryHasData: true });

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(1);
      expect(searchExactAndSetPage).toHaveBeenCalledWith("tiger");
    });
  });

  it("запускается один раз за жизнь инстанса: дальнейшие изменения qFromUrl не триггерят повторно", async () => {
    const { rerender } = renderHook(
      (props: { qFromUrl: string; queryHasData: boolean }) =>
        useInitialSearchFromUrl({
          qFromUrl: props.qFromUrl,
          queryHasData: props.queryHasData,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      {
        initialProps: { qFromUrl: "tiger", queryHasData: true },
      },
    );

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(1);
    });

    // меняем qFromUrl, но поиск повторяться не должен
    rerender({ qFromUrl: "kv-1", queryHasData: true });
    rerender({ qFromUrl: "panther", queryHasData: true });

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(1);
      expect(searchExactAndSetPage).toHaveBeenCalledWith("tiger");
    });
  });

  it("если сначала qFromUrl пустой, а потом появился (при наличии данных) — вызовет один раз", async () => {
    const { rerender } = renderHook(
      (props: { qFromUrl: string; queryHasData: boolean }) =>
        useInitialSearchFromUrl({
          qFromUrl: props.qFromUrl,
          queryHasData: props.queryHasData,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
      { initialProps: { qFromUrl: "", queryHasData: true } },
    );

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(0);
    });

    rerender({ qFromUrl: "tiger", queryHasData: true });

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(1);
      expect(searchExactAndSetPage).toHaveBeenCalledWith("tiger");
    });

    // повторно уже не должен
    rerender({ qFromUrl: "kv-1", queryHasData: true });

    await waitFor(() => {
      expect(searchExactAndSetPage).toHaveBeenCalledTimes(1);
    });
  });

  it("не запускает повторно, если меняется ссылка на searchExactAndSetPage после того как автопоиск уже выполнен", async () => {
    const fn1 = vi.fn(() => Promise.resolve());
    const fn2 = vi.fn(() => Promise.resolve());

    const { rerender } = renderHook(
      (props: { handler: (q: string) => Promise<void> }) =>
        useInitialSearchFromUrl({
          qFromUrl: "tiger",
          queryHasData: true,
          searchExactAndSetPage: props.handler,
        }),
      { initialProps: { handler: fn1 } },
    );

    await waitFor(() => {
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn1).toHaveBeenCalledWith("tiger");
    });

    // меняем обработчик — повторного автопоиска быть не должно
    rerender({ handler: fn2 });

    await waitFor(() => {
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(0);
    });
  });
});
