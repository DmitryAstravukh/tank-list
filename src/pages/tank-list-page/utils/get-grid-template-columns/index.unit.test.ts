import { TABLE_COLUMN_CONFIG } from "../../constants";
import { TANK_REQUEST_FIELDS } from "./../../../../entities/tank/constants/index";
import { getGridTemplateColumns } from "./index";
import { describe, it, expect } from "vitest";

describe("columnConfig", () => {
  it("содержит конфигурацию для каждого поля из TANK_REQUEST_FIELDS", () => {
    TANK_REQUEST_FIELDS.forEach((field) => {
      expect(TABLE_COLUMN_CONFIG).toHaveProperty(field);
    });
  });

  it("каждое поле имеет непустую строку width", () => {
    TANK_REQUEST_FIELDS.forEach((field) => {
      expect(TABLE_COLUMN_CONFIG[field].width).toEqual(expect.any(String));
      expect(TABLE_COLUMN_CONFIG[field].width.length).toBeGreaterThan(0);
    });
  });

  it("responsiveClass, если задан, является допустимым CSS-классом", () => {
    const validClasses = ["col-hide-xl", "col-hide-lg", "col-hide-md", "col-hide-sm"];

    Object.values(TABLE_COLUMN_CONFIG).forEach((config) => {
      if (config.responsiveClass) {
        expect(validClasses).toContain(config.responsiveClass);
      }
    });
  });
});

describe("getGridTemplateColumns", () => {
  const result = getGridTemplateColumns();

  it("возвращает строку с шириной каждой колонки, разделённой пробелом", () => {
    expect(result).toBe("86px minmax(240px, 1.8fr) 92px 130px 130px 129px 170px");
  });

  it("количество CSS-значений равно количеству полей", () => {
    // minmax(...) содержит пробел внутри, поэтому split(" ") не подходит
    const cssValues = result.match(/minmax\([^)]+\)|\S+/g) ?? [];
    expect(cssValues).toHaveLength(TANK_REQUEST_FIELDS.length);
  });

  it("порядок ширин соответствует порядку TANK_REQUEST_FIELDS", () => {
    const expected = TANK_REQUEST_FIELDS.map((field) => TABLE_COLUMN_CONFIG[field].width).join(" ");

    expect(result).toBe(expected);
  });

  it("не содержит двойных пробелов", () => {
    expect(result).not.toMatch(/ {2}/);
  });

  it("не содержит начальных и конечных пробелов", () => {
    expect(result).toBe(result.trim());
  });
});
