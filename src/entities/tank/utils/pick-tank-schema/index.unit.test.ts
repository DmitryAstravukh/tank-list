import { describe, it, expect } from "vitest";
import { z } from "zod";
import { pickTankSchema } from ".";

const validImages = {
  small_icon: "http://example.com/small.png",
  contour_icon: "http://example.com/contour.png",
  big_icon: "http://example.com/big.png",
} as const;

describe("pickTankSchema", () => {
  it("создаёт схему с единственным полем", () => {
    const schema = pickTankSchema(["tank_id"] as const);

    expect(schema.parse({ tank_id: 42 })).toEqual({ tank_id: 42 });
  });

  it("создаёт схему с несколькими полями", () => {
    const schema = pickTankSchema(["tank_id", "name", "tier"] as const);
    const data = { tank_id: 1, name: "Т-34", tier: 5 };

    expect(schema.parse(data)).toEqual(data);
  });

  it("shape содержит ровно запрошенные ключи", () => {
    const fields = ["tank_id", "name", "is_premium"] as const;
    const schema = pickTankSchema(fields);

    const shapeKeys = Object.keys(schema.shape).sort();
    expect(shapeKeys).toEqual([...fields].sort());
  });

  it("отклоняет данные с отсутствующим обязательным полем", () => {
    const schema = pickTankSchema(["tank_id", "name"] as const);

    expect(() => schema.parse({ tank_id: 1 })).toThrow(z.ZodError);
  });

  it("отклоняет данные с неверным типом поля", () => {
    const schema = pickTankSchema(["tank_id"] as const);

    expect(() => schema.parse({ tank_id: "not_a_number" })).toThrow(z.ZodError);
  });

  it("стрипает лишние поля (по умолчанию zod strip)", () => {
    const schema = pickTankSchema(["tank_id"] as const);
    const result = schema.parse({ tank_id: 1, name: "лишнее" });

    expect(result).toEqual({ tank_id: 1 });
    expect(result).not.toHaveProperty("name");
  });

  it("валидирует вложенный объект (images)", () => {
    const schema = pickTankSchema(["images"] as const);

    expect(schema.parse({ images: validImages })).toEqual({ images: validImages });

    expect(() => schema.parse({ images: { small_icon: "not-a-url" } })).toThrow(z.ZodError);
  });

  it("валидирует boolean-поля", () => {
    const schema = pickTankSchema(["is_premium", "is_gift", "is_wheeled"] as const);

    expect(schema.parse({ is_premium: true, is_gift: false, is_wheeled: false })).toEqual({
      is_premium: true,
      is_gift: false,
      is_wheeled: false,
    });

    expect(() => schema.parse({ is_premium: "yes", is_gift: false, is_wheeled: false })).toThrow(
      z.ZodError,
    );
  });

  it("валидирует массив чисел (radios)", () => {
    const schema = pickTankSchema(["radios"] as const);

    expect(schema.parse({ radios: [1, 2, 3] })).toEqual({ radios: [1, 2, 3] });
    expect(schema.parse({ radios: [] })).toEqual({ radios: [] });
    expect(() => schema.parse({ radios: ["a"] })).toThrow(z.ZodError);
  });

  it("валидирует nullable-поле (multination)", () => {
    const schema = pickTankSchema(["multination"] as const);

    expect(schema.parse({ multination: null })).toEqual({ multination: null });
    expect(schema.parse({ multination: "anything" })).toEqual({
      multination: "anything",
    });
  });

  it("валидирует enum-поле (type)", () => {
    const schema = pickTankSchema(["type"] as const);

    expect(schema.parse({ type: "mediumTank" })).toEqual({ type: "mediumTank" });
    expect(schema.parse({ type: "SPG" })).toEqual({ type: "SPG" });
    expect(() => schema.parse({ type: "unknownType" })).toThrow(z.ZodError);
  });

  it("валидирует record-поле (next_tanks)", () => {
    const schema = pickTankSchema(["next_tanks"] as const);

    expect(schema.parse({ next_tanks: { "2561": 27825 } })).toEqual({
      next_tanks: { "2561": 27825 },
    });
    expect(() => schema.parse({ next_tanks: { a: "b" } })).toThrow(z.ZodError);
  });
});
