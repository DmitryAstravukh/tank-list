import type { TankField } from "../types";

/**
 * Словарь UI-лейблов для полей танка.
 * Маппинг ключей {@link TankField} на человекочитаемые названия для отображения в интерфейсе.
 *
 * @see {@link TankField} — допустимые ключи
 * @see {@link getTableColumns} — использует эти лейблы для генерации заголовков таблицы
 */
export const TANK_FIELD_LABELS = {
  tank_id: "ID",
  name: "Название",
  short_name: "Сокращённое название",
  tier: "Уровень",
  type: "Тип",
  nation: "Нация",
  is_premium: "Премиум",
  is_gift: "Подарочная",
  is_wheeled: "Колёсная",
  is_premium_igr: "Премиум IGR",
  tag: "Тег",
  description: "Описание",
  price_credit: "Стоимость в серебре",
  price_gold: "Стоимость в золоте",
  images: "Изображения",
  radios: "Радиостанции",
  suspensions: "Ходовые",
  provisions: "Оборудование и снаряжение",
  engines: "Двигатели",
  crew: "Экипаж",
  guns: "Орудия",
  turrets: "Башни",
  multination: "Мультинации",
  next_tanks: "Список доступной для исследования техники",
  modules_tree: "Исследование модулей",
  prices_xp: "Стоимость исследования",
  default_profile: "Характеристики базовой комплектации",
} as const satisfies Record<TankField, string>;

/**
 * Список полей танка для запроса к API.
 * Определяет состав query-параметра `fields`, структуру ответа и набор колонок таблицы.
 *
 * @example
 * const param = buildFieldsParam(TANK_REQUEST_FIELDS);
 * // "tank_id,name,tier,type,nation,is_premium,price_credit,short_name,images"
 *
 * @see {@link buildFieldsParam} — сериализует этот массив в строку
 * @see {@link pickTankSchema} — строит Zod-схему по этому списку
 * @see {@link buildApiResponseSchema} — строит схему ответа API по этому списку
 */
export const TANK_REQUEST_FIELDS = [
  "tank_id",
  "name",
  "tier",
  "type",
  "nation",
  "is_premium",
  "price_credit",
] as const satisfies readonly TankField[];
