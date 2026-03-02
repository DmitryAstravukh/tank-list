import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { expect, test } from "vitest";

test("increments count on button click", () => {
  render(<App />);

  const button = screen.getByRole("button", { name: /count is 0/i });
  fireEvent.click(button);

  expect(button).toHaveTextContent("count is 1");
});
