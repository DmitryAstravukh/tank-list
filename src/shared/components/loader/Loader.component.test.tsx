import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { Loader } from "./Loader";
import { useIsFetching } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useIsFetching: vi.fn(),
}));

describe("Loader", () => {
  const mockedUseIsFetching = vi.mocked(useIsFetching);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("всегда рендерит progressbar с aria-label Загрузка", () => {
    mockedUseIsFetching.mockReturnValue(0);

    render(<Loader />);

    const progressbar = screen.getByRole("progressbar", { name: "Загрузка" });
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveClass("loader");
  });

  it("когда fetchCount === 0: контейнер НЕ содержит класс is-visible", () => {
    mockedUseIsFetching.mockReturnValue(0);

    const { container } = render(<Loader />);

    const wrapper = container.querySelector(".loader-container");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).not.toHaveClass("is-visible");
  });

  it("когда fetchCount > 0: контейнер содержит класс is-visible", () => {
    mockedUseIsFetching.mockReturnValue(3);

    const { container } = render(<Loader />);

    const wrapper = container.querySelector(".loader-container");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("is-visible");
  });
});
