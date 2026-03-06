import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NotFound } from "./NotFound";
import { useNavigate } from "react-router-dom";

vi.mock("./NotFound.scss", () => ({}));

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe("NotFound", () => {
  const mockedUseNavigate = vi.mocked(useNavigate);

  let initialTitle: string;

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseNavigate.mockReturnValue(navigateMock);

    initialTitle = document.title;
    document.title = "Мой заголовок";
  });

  afterEach(() => {
    document.title = initialTitle;
  });

  it("рендерит заголовок, картинку и кнопку", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "Любопытный?" })).toBeInTheDocument();
    expect(screen.getByAltText("Собака осудительно смотрит")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "На главную" })).toBeInTheDocument();
  });

  it("по клику на кнопку вызывает navigate('/')", () => {
    render(<NotFound />);

    fireEvent.click(screen.getByRole("button", { name: "На главную" }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("устанавливает document.title при маунте и восстанавливает при анмаунте", async () => {
    const previousTitle = document.title;

    const { unmount } = render(<NotFound />);

    await waitFor(() => {
      expect(document.title).toBe("404 — Страница не найдена");
    });

    unmount();

    expect(document.title).toBe(previousTitle);
  });
});
