import z from "zod";
import { tankSchemaObj } from "../../schema";
import type { TankField } from "../../types";

/**
 * Фабрика Zod-схемы танка с выбранными полями.
 * Извлекает нужные валидаторы из {@link tankSchemaObj} и оборачивает в `z.object`.
 *
 * @template {readonly TankField[]} F — кортеж имён полей танка
 * @param {F} fields — массив полей для включения в схему
 * @returns {z.ZodObject} Zod-схема, содержащая только указанные поля
 *
 * @example
 * const schema = pickTankSchema(["tank_id", "name", "tier"] as const);
 * const data = schema.parse({ tank_id: 1, name: "T-34", tier: 5 });
 *
 * @see {@link tankSchemaObj} — источник схем для всех полей
 * @see {@link buildApiResponseSchema} — использует эту функцию внутри
 */
export const pickTankSchema = <const F extends readonly TankField[]>(fields: F) => {
  const obj = {} as {
    [K in F[number]]: (typeof tankSchemaObj)[K];
  };

  for (const field of fields) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any)[field] = tankSchemaObj[field];
  }

  return z.object(obj);
};
