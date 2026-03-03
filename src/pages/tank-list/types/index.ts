import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import type { Tank } from "@/entities/tank/types";
import type z from "zod";
import type { ApiResponseTankSelectedFieldsSchema, TankApiResponseSchema } from "../schema";

/**
 * Тип ответа API с выбранными полями танка.
 * Результат валидации {@link ApiResponseTankSelectedFieldsSchema}.
 *
 * @see {@link ApiResponseTankSelectedFieldsSchema} — Zod-схема, из которой выведен этот тип
 * @see {@link TankApiResponse} — полный тип ответа API
 */
export type ApiResponseTankSelectedFields = z.infer<typeof ApiResponseTankSelectedFieldsSchema>;

/**
 * TypeScript-тип полного ответа API.
 * Структура ответа сервера: статус, мета-информация, словарь танков.
 *
 * @see {@link TankApiResponseSchema} — Zod-схема, из которой выведен этот тип
 */
export type TankApiResponse = z.infer<typeof TankApiResponseSchema>;

/**
 * Тип ключа запрошенного поля.
 * Подмножество {@link TankField}, ограниченное элементами {@link TANK_REQUEST_FIELDS}.
 *
 * @see {@link TANK_REQUEST_FIELDS} — массив, элементы которого формируют этот тип
 * @see {@link RequestedTank} — использует этот тип для Pick
 */
export type RequestedField = (typeof TANK_REQUEST_FIELDS)[number];

/**
 * Тип танка с ограниченным набором полей.
 * Содержит только поля, запрошенные через {@link TANK_REQUEST_FIELDS}.
 *
 * @see {@link Tank} — полный тип танка
 * @see {@link RequestedField} — ключи, используемые для Pick
 */
export type RequestedTank = Pick<Tank, RequestedField>;
