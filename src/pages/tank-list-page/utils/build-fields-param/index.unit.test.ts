import { tankSchemaObj } from "@/entities/tank/schema";
import { buildFieldsParam } from "./index";
import { describe, it, expect } from "vitest";

describe("buildFieldsParam", () => {
  it("возвращает пустую строку для пустого массива", () => {
    expect(buildFieldsParam([] as const)).toBe("");
  });

  it("возвращает одно поле без запятой", () => {
    expect(buildFieldsParam(["tank_id"] as const)).toBe("tank_id");
  });

  it("соединяет несколько полей через запятую", () => {
    const result = buildFieldsParam(["tank_id", "name", "tier"] as const);
    expect(result).toBe("tank_id,name,tier");
  });

  it("сохраняет порядок полей", () => {
    const a = buildFieldsParam(["tier", "name"] as const);
    const b = buildFieldsParam(["name", "tier"] as const);

    expect(a).toBe("tier,name");
    expect(b).toBe("name,tier");
    expect(a).not.toBe(b);
  });

  it("корректно обрабатывает все поля", () => {
    const allFields = Object.keys(tankSchemaObj) as (keyof typeof tankSchemaObj)[];
    const result = buildFieldsParam(allFields);

    expect(result.split(",")).toEqual(allFields);
  });
});
