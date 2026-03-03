import { getTableColumns } from "./index";
import { describe, it, expect } from "vitest";
import { TANK_FIELD_LABELS } from "@/entities/tank/constants";
import { tankSchemaObj } from "@/entities/tank/schema";

describe("getTableColumns", () => {
  it("возвращает пустой массив для пустого списка полей", () => {
    const result = getTableColumns([] as const);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("возвращает одну колонку для одного поля", () => {
    const result = getTableColumns(["name"] as const);

    expect(result).toEqual([{ key: "name", label: "Название" }]);
  });

  it("возвращает колонки в том же порядке, что и входной массив", () => {
    const fields = ["tier", "name", "tank_id"] as const;
    const result = getTableColumns(fields);

    expect(result.map((c) => c.key)).toEqual(["tier", "name", "tank_id"]);
  });

  it("сопоставляет каждому полю правильный лейбл из TANK_FIELD_LABELS", () => {
    const fields = ["tank_id", "nation", "is_premium", "type"] as const;
    const result = getTableColumns(fields);

    result.forEach((col) => {
      expect(col.label).toBe(TANK_FIELD_LABELS[col.key]);
    });
  });

  it("корректно обрабатывает все существующие поля", () => {
    const allFields = Object.keys(tankSchemaObj) as (keyof typeof tankSchemaObj)[];
    const result = getTableColumns(allFields);

    expect(result).toHaveLength(allFields.length);
    result.forEach((col) => {
      expect(col).toHaveProperty("key");
      expect(col).toHaveProperty("label");
      expect(typeof col.key).toBe("string");
      expect(typeof col.label).toBe("string");
    });
  });
});
