import type z from "zod";
import type { TankSchema, tankSchemaObj } from "../schema";

/**
 * TypeScript тип танка со всеми полями.
 * Авто-генерируемый из {@link TankSchema}, используется в бизнес-логике.
 *
 * @see {@link TankSchema} — Zod-схема, из которой выведен этот тип
 * @see {@link RequestedTank} — тип танка с ограниченным набором полей
 */
export type Tank = z.infer<typeof TankSchema>;

/**
 * Union тип ключей полей танка.
 * Все допустимые имена свойств сущности танка.
 *
 * @see {@link tankSchemaObj} — объект, ключи которого формируют этот тип
 * @see {@link TANK_FIELD_LABELS} — словарь лейблов для этих ключей
 */
export type TankField = keyof typeof tankSchemaObj;
