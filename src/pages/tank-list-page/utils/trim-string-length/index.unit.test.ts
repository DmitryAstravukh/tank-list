import { describe, it, expect } from "vitest";
import { trimStringLength } from "./index";

describe("trim stringLength", () => {
  it("Не обрезает, если длина <= maxLen", () => {
    expect(trimStringLength("hello", 5)).toBe("hello");
    expect(trimStringLength("hello", 10)).toBe("hello");
  });

  it("Обрезает, если длина > maxLen", () => {
    expect(trimStringLength("hello", 4)).toBe("hell");
  });

  it("Работает с maxLen = 0", () => {
    expect(trimStringLength("hello", 0)).toBe("");
  });

  it("Не изменяет пустую строку", () => {
    expect(trimStringLength("", 100)).toBe("");
  });
});
