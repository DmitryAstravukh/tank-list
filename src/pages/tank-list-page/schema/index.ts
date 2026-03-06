import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import { TankSchema } from "@/entities/tank/schema";
import { buildApiResponseSchema, pickTankSchema } from "@/entities/tank/utils";
import { ResponseMetaSchema } from "@/shared/schema";
import z from "zod";

/**
 * Схема валидации полного ответа API для танков.
 * Структура ответа: статус, мета-данные пагинации, словарь танков по ID.
 *
 * @see {@link TankApiResponse} — TypeScript-тип, выведенный из этой схемы
 * @see {@link buildApiResponseSchema} — динамическая версия этой схемы
 */
export const TankApiResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  meta: ResponseMetaSchema,
  data: z.record(z.string(), TankSchema),
});

/**
 * Динамическая схема танка с выбранными полями.
 * Валидирует только поля, указанные в {@link TANK_REQUEST_FIELDS}.
 *
 * @see {@link TANK_REQUEST_FIELDS} — поля, используемые для этой схемы
 * @see {@link pickTankSchema} — функция-конструктор
 * @see {@link RequestedTank} — TypeScript-тип, выведенный из этой схемы
 */
export const RequestedTankSelectedFieldsSchema = pickTankSchema(TANK_REQUEST_FIELDS);

/**
 * Схема ответа API с динамическими полями танка.
 * Обёртка над {@link RequestedTankSelectedFieldsSchema} для валидации всего ответа сервера.
 *
 * @see {@link ApiResponseTankSelectedFields} — TypeScript-тип, выведенный из этой схемы
 * @see {@link TankApiResponseSchema} — полная версия этой схемы
 */
export const ApiResponseTankSelectedFieldsSchema = buildApiResponseSchema(TANK_REQUEST_FIELDS);
