import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { Pagination } from "./Pagination";
import { useIsFetching } from "@tanstack/react-query";
import { usePagination } from "./hooks/use-pagination";
import { getTotalPages } from "./utils";

vi.mock("./Pagination.scss", () => ({}));

vi.mock("@tanstack/react-query", () => ({
  useIsFetching: vi.fn(),
}));

vi.mock("./hooks/use-pagination", () => ({
  usePagination: vi.fn(),
}));

vi.mock("./utils", () => ({
  getTotalPages: vi.fn(),
}));

describe("Pagination", () => {
  const mockedUseIsFetching = vi.mocked(useIsFetching);
  const mockedUsePagination = vi.mocked(usePagination);
  const mockedGetTotalPages = vi.mocked(getTotalPages);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("возвращает null, если totalPages <= 1", () => {
    mockedUseIsFetching.mockReturnValue(0);
    mockedUsePagination.mockReturnValue([1]);
    mockedGetTotalPages.mockReturnValue(1);

    render(
      <Pagination currentPage={1} totalItems={10} pageSize={10} handlePageChange={() => {}} />,
    );

    expect(screen.queryByRole("navigation", { name: "Пагинация" })).not.toBeInTheDocument();
  });

  it("рендерит навигацию, страницы, троеточие и активную страницу с aria-current", () => {
    mockedUseIsFetching.mockReturnValue(0);
    mockedUsePagination.mockReturnValue([1, 2, 3, "...", 5]);
    mockedGetTotalPages.mockReturnValue(5);

    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalItems={50}
        pageSize={10}
        handlePageChange={handlePageChange}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Пагинация" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Страница 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Страница 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Страница 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Страница 5" })).toBeInTheDocument();

    expect(screen.getByText("...")).toBeInTheDocument();

    const active = screen.getByRole("button", { name: "Страница 2" });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active.className).toContain("pagination__button--active");

    fireEvent.click(screen.getByRole("button", { name: "Страница 3" }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it("кнопка Предыдущая страница disabled на первой странице; Следующая страница кликабельна", () => {
    mockedUseIsFetching.mockReturnValue(0);
    mockedUsePagination.mockReturnValue([1, 2, 3]);
    mockedGetTotalPages.mockReturnValue(3);

    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalItems={30}
        pageSize={10}
        handlePageChange={handlePageChange}
      />,
    );

    const prev = screen.getByRole("button", { name: "Предыдущая страница" });
    const next = screen.getByRole("button", { name: "Следующая страница" });

    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("кнопка Следующая страница disabled на последней странице; Предыдущая страница кликабельна", () => {
    mockedUseIsFetching.mockReturnValue(0);
    mockedUsePagination.mockReturnValue([1, 2, 3]);
    mockedGetTotalPages.mockReturnValue(3);

    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={3}
        totalItems={30}
        pageSize={10}
        handlePageChange={handlePageChange}
      />,
    );

    const prev = screen.getByRole("button", { name: "Предыдущая страница" });
    const next = screen.getByRole("button", { name: "Следующая страница" });

    expect(next).toBeDisabled();
    expect(prev).not.toBeDisabled();

    fireEvent.click(prev);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("во время загрузки (useIsFetching > 0) все кнопки disabled и handlePageChange не вызывается", () => {
    mockedUseIsFetching.mockReturnValue(2);
    mockedUsePagination.mockReturnValue([1, 2, 3]);
    mockedGetTotalPages.mockReturnValue(3);

    const handlePageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalItems={30}
        pageSize={10}
        handlePageChange={handlePageChange}
      />,
    );

    const prev = screen.getByRole("button", { name: "Предыдущая страница" });
    const next = screen.getByRole("button", { name: "Следующая страница" });
    const page1 = screen.getByRole("button", { name: "Страница 1" });

    expect(prev).toBeDisabled();
    expect(next).toBeDisabled();
    expect(page1).toBeDisabled();

    fireEvent.click(next);
    fireEvent.click(page1);

    expect(handlePageChange).not.toHaveBeenCalled();
  });
});
