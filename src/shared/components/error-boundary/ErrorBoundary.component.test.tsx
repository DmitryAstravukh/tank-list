import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("./ErrorBoundary.scss", () => ({}));

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("по клику на Починить сбрасывает ошибку и вызывает onReset", () => {
    let shouldThrow = true;

    function BoomSometimes() {
      if (shouldThrow) throw new Error("boom");
      return <div>Починилось</div>;
    }

    const onReset = vi.fn(() => {
      shouldThrow = false;
    });

    render(
      <ErrorBoundary onReset={onReset}>
        <BoomSometimes />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Зачем сломал?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Починить" }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Починилось")).toBeInTheDocument();
    expect(screen.queryByText("Зачем сломал?")).not.toBeInTheDocument();
  });
});
