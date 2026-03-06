import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useClampUiPage } from "./index";
import type { PatchUrlFn } from "../use-tank-browser-url-state";

vi.mock("../../utils", () => ({
  clamp: vi.fn((value: number, min: number, max: number) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }),
}));

describe("useClampUiPage", () => {
  let setCurrentPage: ReturnType<typeof vi.fn<(p: number) => void>>;
  let patchUrl: ReturnType<typeof vi.fn<PatchUrlFn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentPage = vi.fn<(p: number) => void>();
    patchUrl = vi.fn<PatchUrlFn>();
  });

  it("ничего не делает, если queryHasData === false", () => {
    renderHook(() =>
      useClampUiPage({
        queryHasData: false,
        currentPage: 999,
        totalUiPages: 10,
        setCurrentPage,
        patchUrl,
      }),
    );

    expect(setCurrentPage).not.toHaveBeenCalled();
    expect(patchUrl).not.toHaveBeenCalled();
  });

  it("ничего не делает, если currentPage в допустимом диапазоне", () => {
    renderHook(() =>
      useClampUiPage({
        queryHasData: true,
        currentPage: 5,
        totalUiPages: 10,
        setCurrentPage,
        patchUrl,
      }),
    );

    expect(setCurrentPage).not.toHaveBeenCalled();
    expect(patchUrl).not.toHaveBeenCalled();
  });

  it("clamp до 1, если currentPage < 1", () => {
    renderHook(() =>
      useClampUiPage({
        queryHasData: true,
        currentPage: 0,
        totalUiPages: 10,
        setCurrentPage,
        patchUrl,
      }),
    );

    expect(setCurrentPage).toHaveBeenCalledTimes(1);
    expect(setCurrentPage).toHaveBeenCalledWith(1);

    expect(patchUrl).toHaveBeenCalledTimes(1);
    expect(patchUrl).toHaveBeenCalledWith({ page: 1 }, { replace: true });
  });

  it("clamp до totalUiPages, если currentPage > totalUiPages", () => {
    renderHook(() =>
      useClampUiPage({
        queryHasData: true,
        currentPage: 100,
        totalUiPages: 10,
        setCurrentPage,
        patchUrl,
      }),
    );

    expect(setCurrentPage).toHaveBeenCalledTimes(1);
    expect(setCurrentPage).toHaveBeenCalledWith(10);

    expect(patchUrl).toHaveBeenCalledTimes(1);
    expect(patchUrl).toHaveBeenCalledWith({ page: 10 }, { replace: true });
  });

  it("реагирует на изменение currentPage (rerender с новыми props)", () => {
    const { rerender } = renderHook(
      (props: Parameters<typeof useClampUiPage>[0]) => useClampUiPage(props),
      {
        initialProps: {
          queryHasData: true,
          currentPage: 5,
          totalUiPages: 10,
          setCurrentPage,
          patchUrl,
        },
      },
    );

    expect(setCurrentPage).not.toHaveBeenCalled();
    expect(patchUrl).not.toHaveBeenCalled();

    rerender({
      queryHasData: true,
      currentPage: 20,
      totalUiPages: 10,
      setCurrentPage,
      patchUrl,
    });

    expect(setCurrentPage).toHaveBeenCalledTimes(1);
    expect(setCurrentPage).toHaveBeenCalledWith(10);

    expect(patchUrl).toHaveBeenCalledTimes(1);
    expect(patchUrl).toHaveBeenCalledWith({ page: 10 }, { replace: true });
  });

  it("реагирует на изменение totalUiPages (rerender с меньшим totalUiPages)", () => {
    const { rerender } = renderHook(
      (props: Parameters<typeof useClampUiPage>[0]) => useClampUiPage(props),
      {
        initialProps: {
          queryHasData: true,
          currentPage: 10,
          totalUiPages: 10,
          setCurrentPage,
          patchUrl,
        },
      },
    );

    expect(setCurrentPage).not.toHaveBeenCalled();

    rerender({
      queryHasData: true,
      currentPage: 10,
      totalUiPages: 5,
      setCurrentPage,
      patchUrl,
    });

    expect(setCurrentPage).toHaveBeenCalledTimes(1);
    expect(setCurrentPage).toHaveBeenCalledWith(5);

    expect(patchUrl).toHaveBeenCalledTimes(1);
    expect(patchUrl).toHaveBeenCalledWith({ page: 5 }, { replace: true });
  });

  it("начинает работать, когда queryHasData меняется с false на true", () => {
    const { rerender } = renderHook(
      (props: Parameters<typeof useClampUiPage>[0]) => useClampUiPage(props),
      {
        initialProps: {
          queryHasData: false,
          currentPage: 100,
          totalUiPages: 10,
          setCurrentPage,
          patchUrl,
        },
      },
    );

    expect(setCurrentPage).not.toHaveBeenCalled();

    rerender({
      queryHasData: true,
      currentPage: 100,
      totalUiPages: 10,
      setCurrentPage,
      patchUrl,
    });

    expect(setCurrentPage).toHaveBeenCalledTimes(1);
    expect(setCurrentPage).toHaveBeenCalledWith(10);

    expect(patchUrl).toHaveBeenCalledTimes(1);
    expect(patchUrl).toHaveBeenCalledWith({ page: 10 }, { replace: true });
  });

  it("корректно обрабатывает граничный случай: totalUiPages = 1", () => {
    renderHook(() =>
      useClampUiPage({
        queryHasData: true,
        currentPage: 5,
        totalUiPages: 1,
        setCurrentPage,
        patchUrl,
      }),
    );

    expect(setCurrentPage).toHaveBeenCalledWith(1);
    expect(patchUrl).toHaveBeenCalledWith({ page: 1 }, { replace: true });
  });
});
