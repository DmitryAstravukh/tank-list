import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, within, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { Header } from "./Header";
import { useIsFetching } from "@tanstack/react-query";

vi.mock("./Header.scss", () => ({}));

vi.mock("../constants", () => ({
  PAGINATION_PAGE_SIZES: [5, 10],
  SEARCH_QUERY_MIN_LEN: 2,
  SEARCH_QUERY_MAX_LEN: 5,
}));

vi.mock("../utils/trim-string-length", () => ({
  trimStringLength: (value: string, maxLen: number) => value.slice(0, maxLen),
}));

vi.mock("@tanstack/react-query", () => ({
  useIsFetching: vi.fn(),
}));

describe("Header", () => {
  const mockedUseIsFetching = vi.mocked(useIsFetching);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHeader(params?: { qFromUrl?: string; fetchingCount?: number }) {
    const qFromUrl = params?.qFromUrl ?? "";
    const fetchingCount = params?.fetchingCount ?? 0;

    mockedUseIsFetching.mockReturnValue(fetchingCount);

    const runSearch = vi.fn();
    const handleSearchClick = vi.fn((q: string) => () => runSearch(q));
    const handleSearchClear = vi.fn();
    const handlePageSizeChange = vi.fn();

    const view = render(
      <Header
        handleSearchClick={handleSearchClick}
        handleSearchClear={handleSearchClear}
        handlePageSizeChange={handlePageSizeChange}
        qFromUrl={qFromUrl}
      />,
    );

    const q = within(view.container);

    const getInput = () => q.getByRole("searchbox") as HTMLInputElement;
    const getSelect = () => q.getByRole("combobox") as HTMLSelectElement;

    const getSearchButton = () =>
      view.container.querySelector(".header__search__button") as HTMLButtonElement | null;

    const queryClearButton = () =>
      q.queryByRole("button", { name: "Очистить поиск" }) as HTMLButtonElement | null;

    const getClearButton = () =>
      q.getByRole("button", { name: "Очистить поиск" }) as HTMLButtonElement;

    return {
      view,
      q,
      runSearch,
      handleSearchClick,
      handleSearchClear,
      handlePageSizeChange,
      getInput,
      getSelect,
      getSearchButton,
      queryClearButton,
      getClearButton,
    };
  }

  it("рендерит заголовок", () => {
    const t = renderHeader();
    expect(t.q.getByRole("heading", { name: "Танковедение" })).toBeInTheDocument();
  });

  it("инициализирует значение инпута из qFromUrl", () => {
    const t = renderHeader({ qFromUrl: "abc" });
    expect(t.getInput().value).toBe("abc");
  });

  it("синхронизирует значение инпута при изменении qFromUrl", () => {
    mockedUseIsFetching.mockReturnValue(0);

    const runSearch = vi.fn();
    const handleSearchClick = vi.fn((q: string) => () => runSearch(q));
    const handleSearchClear = vi.fn();
    const handlePageSizeChange = vi.fn();

    const view = render(
      <Header
        handleSearchClick={handleSearchClick}
        handleSearchClear={handleSearchClear}
        handlePageSizeChange={handlePageSizeChange}
        qFromUrl="abc"
      />,
    );

    const q = within(view.container);
    expect((q.getByRole("searchbox") as HTMLInputElement).value).toBe("abc");

    view.rerender(
      <Header
        handleSearchClick={handleSearchClick}
        handleSearchClear={handleSearchClear}
        handlePageSizeChange={handlePageSizeChange}
        qFromUrl="xyz"
      />,
    );

    expect((q.getByRole("searchbox") as HTMLInputElement).value).toBe("xyz");
  });

  it("обрезает ввод до SEARCH_QUERY_MAX_LEN", () => {
    const t = renderHeader({ qFromUrl: "" });

    fireEvent.change(t.getInput(), { target: { value: "1234567" } });
    expect(t.getInput().value).toBe("12345");
  });

  it("показывает кнопку очистки только когда search.trim() не пустой (без второго render)", () => {
    mockedUseIsFetching.mockReturnValue(0);

    const runSearch = vi.fn();
    const handleSearchClick = vi.fn((q: string) => () => runSearch(q));
    const handleSearchClear = vi.fn();
    const handlePageSizeChange = vi.fn();

    const view = render(
      <Header
        handleSearchClick={handleSearchClick}
        handleSearchClear={handleSearchClear}
        handlePageSizeChange={handlePageSizeChange}
        qFromUrl="   "
      />,
    );

    const q = within(view.container);
    expect(q.queryByRole("button", { name: "Очистить поиск" })).not.toBeInTheDocument();

    view.rerender(
      <Header
        handleSearchClick={handleSearchClick}
        handleSearchClear={handleSearchClear}
        handlePageSizeChange={handlePageSizeChange}
        qFromUrl="a "
      />,
    );

    expect(q.getByRole("button", { name: "Очистить поиск" })).toBeInTheDocument();
  });

  it("по клику на Очистить поиск очищает инпут и вызывает handleSearchClear", () => {
    const t = renderHeader({ qFromUrl: "abc" });

    fireEvent.click(t.getClearButton());

    expect(t.getInput().value).toBe("");
    expect(t.handleSearchClear).toHaveBeenCalledTimes(1);
    expect(t.queryClearButton()).not.toBeInTheDocument();
  });

  it("делает кнопку поиска disabled если search короче минимума", () => {
    const t = renderHeader({ qFromUrl: "" });

    const searchButton = t.getSearchButton();
    expect(searchButton).not.toBeNull();
    expect(searchButton as HTMLButtonElement).toBeDisabled();
  });

  it("делает кнопку поиска disabled и select disabled во время загрузки (useIsFetching > 0)", () => {
    const t = renderHeader({ qFromUrl: "abcd", fetchingCount: 2 });

    const searchButton = t.getSearchButton();
    expect(searchButton).not.toBeNull();
    expect(searchButton as HTMLButtonElement).toBeDisabled();
    expect(t.getSelect()).toBeDisabled();
  });

  it("по Enter запускает поиск, если кнопка не disabled", () => {
    const t = renderHeader({ qFromUrl: "abcd", fetchingCount: 0 });

    fireEvent.keyDown(t.getInput(), { key: "Enter", code: "Enter", charCode: 13 });

    expect(t.runSearch).toHaveBeenCalledTimes(1);
    expect(t.runSearch).toHaveBeenCalledWith("abcd");
  });

  it("по Enter НЕ запускает поиск, если идет загрузка (disabled)", () => {
    const t = renderHeader({ qFromUrl: "abcd", fetchingCount: 1 });

    fireEvent.keyDown(t.getInput(), { key: "Enter", code: "Enter", charCode: 13 });

    expect(t.runSearch).not.toHaveBeenCalled();
  });

  it("по клику на кнопку поиска запускает поиск", () => {
    const t = renderHeader({ qFromUrl: "abcd", fetchingCount: 0 });

    const searchButton = t.getSearchButton();
    expect(searchButton).not.toBeNull();

    fireEvent.click(searchButton as HTMLButtonElement);

    expect(t.runSearch).toHaveBeenCalledTimes(1);
    expect(t.runSearch).toHaveBeenCalledWith("abcd");
  });

  it("дергает handlePageSizeChange при смене select (когда не disabled)", () => {
    const t = renderHeader({ qFromUrl: "abcd", fetchingCount: 0 });

    fireEvent.change(t.getSelect(), { target: { value: "10" } });
    expect(t.handlePageSizeChange).toHaveBeenCalledTimes(1);
  });
});
