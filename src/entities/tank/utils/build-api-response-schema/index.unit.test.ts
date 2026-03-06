import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildApiResponseSchema } from ".";

const validMeta = {
  count: 1,
  page_total: 1,
  total: 1,
  limit: 10,
  page: 1,
} as const;

const validImages = {
  small_icon: "http://example.com/small.png",
  contour_icon: "http://example.com/contour.png",
  big_icon: "http://example.com/big.png",
} as const;

const minimalTank = {
  tank_id: 1,
  name: "Т-34",
  tier: 5,
  type: "mediumTank",
  nation: "ussr",
  is_premium: false,
  price_credit: 356700,
  short_name: "Т-34",
  images: validImages,
} as const;

describe("buildApiResponseSchema", () => {
  const fields = ["tank_id", "name", "tier"] as const;

  it("принимает валидный ответ", () => {
    const schema = buildApiResponseSchema(fields);
    const data = {
      status: "ok" as const,
      meta: validMeta,
      data: { "1": { tank_id: 1, name: "Т-34", tier: 5 } },
    };

    expect(schema.parse(data)).toEqual(data);
  });

  it("принимает status 'error'", () => {
    const schema = buildApiResponseSchema(fields);
    const data = {
      status: "error" as const,
      meta: validMeta,
      data: {},
    };

    expect(schema.parse(data)).toEqual(data);
  });

  it("отклоняет невалидный status", () => {
    const schema = buildApiResponseSchema(fields);

    expect(() => schema.parse({ status: "unknown", meta: validMeta, data: {} })).toThrow(
      z.ZodError,
    );
  });

  it("отклоняет ответ без meta", () => {
    const schema = buildApiResponseSchema(fields);

    expect(() => schema.parse({ status: "ok", data: {} })).toThrow(z.ZodError);
  });

  it("отклоняет невалидную meta (отсутствует поле)", () => {
    const schema = buildApiResponseSchema(fields);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { count, ...incompleteMeta } = validMeta;

    expect(() =>
      schema.parse({
        status: "ok",
        meta: incompleteMeta,
        data: {},
      }),
    ).toThrow(z.ZodError);
  });

  it("отклоняет невалидную meta (неверный тип поля)", () => {
    const schema = buildApiResponseSchema(fields);

    expect(() =>
      schema.parse({
        status: "ok",
        meta: { ...validMeta, count: "one" },
        data: {},
      }),
    ).toThrow(z.ZodError);
  });

  it("отклоняет ответ без data", () => {
    const schema = buildApiResponseSchema(fields);

    expect(() => schema.parse({ status: "ok", meta: validMeta })).toThrow(z.ZodError);
  });

  it("принимает пустой data", () => {
    const schema = buildApiResponseSchema(fields);
    const data = { status: "ok" as const, meta: validMeta, data: {} };

    expect(schema.parse(data)).toEqual(data);
  });

  it("принимает несколько танков в data", () => {
    const schema = buildApiResponseSchema(fields);
    const data = {
      status: "ok" as const,
      meta: { ...validMeta, count: 2, total: 2 },
      data: {
        "1": { tank_id: 1, name: "Т-34", tier: 5 },
        "2": { tank_id: 2, name: "ИС-7", tier: 10 },
      },
    };

    expect(schema.parse(data)).toEqual(data);
  });

  it("отклоняет танк с отсутствующим запрошенным полем в data", () => {
    const schema = buildApiResponseSchema(fields);

    expect(() =>
      schema.parse({
        status: "ok",
        meta: validMeta,
        data: { "1": { tank_id: 1, name: "Т-34" /* tier отсутствует */ } },
      }),
    ).toThrow(z.ZodError);
  });

  it("отклоняет танк с неверным типом поля в data", () => {
    const schema = buildApiResponseSchema(fields);

    expect(() =>
      schema.parse({
        status: "ok",
        meta: validMeta,
        data: { "1": { tank_id: "not_number", name: "Т-34", tier: 5 } },
      }),
    ).toThrow(z.ZodError);
  });

  it("data стрипает лишние поля танка", () => {
    const schema = buildApiResponseSchema(["tank_id"] as const);
    const result = schema.parse({
      status: "ok",
      meta: validMeta,
      data: { "1": { tank_id: 1, name: "лишнее", nation: "ussr" } },
    });

    expect(result.data["1"]).toEqual({ tank_id: 1 });
    expect(result.data["1"]).not.toHaveProperty("name");
  });

  it("использует корректные поля из переданного массива", () => {
    const wideFields = [
      "tank_id",
      "name",
      "tier",
      "type",
      "nation",
      "is_premium",
      "price_credit",
      "short_name",
      "images",
    ] as const;

    const schema = buildApiResponseSchema(wideFields);

    expect(() =>
      schema.parse({
        status: "ok",
        meta: validMeta,
        data: { "1": minimalTank },
      }),
    ).not.toThrow();
  });

  it("полная структура с вложенными объектами валидируется", () => {
    const schema = buildApiResponseSchema(["tank_id", "images", "is_premium"] as const);

    const result = schema.parse({
      status: "ok",
      meta: validMeta,
      data: {
        "1": {
          tank_id: 1,
          images: validImages,
          is_premium: false,
        },
      },
    });

    expect(result.data["1"].images.small_icon).toBe("http://example.com/small.png");
  });
});
