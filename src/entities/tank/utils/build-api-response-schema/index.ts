import z from "zod";
import type { TankField } from "../../types";
import { ResponseMetaSchema } from "@/shared/schema";
import { pickTankSchema } from "../pick-tank-schema";

/**
 * Фабрика полной схемы ответа API с фильтрацией полей.
 * Комбинирует {@link pickTankSchema} со структурой { status, meta, data }.
 *
 * @template {readonly TankField[]} F — кортеж имён полей танка
 * @param {F} fields — массив полей для включения в схему танка
 * @returns {z.ZodObject} Zod-схема ответа API с динамическими полями танка
 *
 * @example
 * const schema = buildApiResponseSchema(TANK_REQUEST_FIELDS);
 * const response = schema.parse(apiResponse);
 *
 * @see {@link pickTankSchema} — создаёт схему танка с выбранными полями
 * @see {@link ResponseMetaSchema} — используется для поля meta
 */
export const buildApiResponseSchema = <const F extends readonly TankField[]>(fields: F) => {
  const vehicleSchema = pickTankSchema(fields);

  return z.object({
    status: z.enum(["ok", "error"]),
    meta: ResponseMetaSchema,
    data: z.record(z.string(), vehicleSchema),
  });
};
