import { describe, it, expect } from "vitest";
import { normalizeForSearch } from "./index";

describe("normalizeForSearch", () => {
  it("удаляет диакритику (предсоставной символ)", () => {
    expect(normalizeForSearch("Löwe")).toBe("lowe");
  });

  it("удаляет диакритику (комбинируемый символ)", () => {
    // "o" + combining diaeresis (U+0308) -> "ö" визуально, но в виде combining
    expect(normalizeForSearch("Lo\u0308we")).toBe("lowe");
  });

  it("обрезает пробелы по краям и приводит к нижнему регистру", () => {
    expect(normalizeForSearch("  HeLLo  ")).toBe("hello");
  });

  it("схлопывает множественные пробелы/переводы строк/табуляции в один пробел", () => {
    expect(normalizeForSearch("  Foo   Bar \n  Baz\t\tQux  ")).toBe("foo bar baz qux");
  });

  it("заменяет ß на ss", () => {
    expect(normalizeForSearch("Straße")).toBe("strasse");
  });

  it("возвращает пустую строку для ввода из одних пробельных символов", () => {
    expect(normalizeForSearch("   \n\t  ")).toBe("");
  });
});
