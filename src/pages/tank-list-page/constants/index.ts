import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import type { TableColumnConfig, TankRequestedField } from "../types";
import { buildFieldsParam } from "../utils";

/**
 * Маппинг полей из {@link TANK_REQUEST_FIELDS} на конфигурацию колонок.
 * Порядок ключей соответствует порядку полей в `TANK_REQUEST_FIELDS`.
 *
 * @type {Record<TankRequestedField, TableColumnConfig>}
 */
export const TABLE_COLUMN_CONFIG: Record<TankRequestedField, TableColumnConfig> = {
  tank_id: { width: "86px" },
  name: { width: "minmax(240px, 1.8fr)" },
  tier: { width: "92px", responsiveClass: "col-hide-sm" },
  type: { width: "130px", responsiveClass: "col-hide-md" },
  nation: { width: "130px", responsiveClass: "col-hide-lg" },
  is_premium: { width: "129px", responsiveClass: "col-hide-sm" },
  price_credit: { width: "170px", responsiveClass: "col-hide-md" },
};

/** Допустимые размеры страницы для пагинации */
export const PAGINATION_PAGE_SIZES = [10, 20, 50, 100] as const;

/** Минимальная длина строи поиска */
export const SEARCH_QUERY_MIN_LEN = 2;

/** Максимальная длина строи поиска */
export const SEARCH_QUERY_MAX_LEN = 100;

/** Максимальное количество запрашиваемое с сервера за 1 раз */
export const SERVER_LIMIT = 100;

/** Поля, которые будут запрошены с сервера */
export const TANK_FIELDS_PARAM = buildFieldsParam(TANK_REQUEST_FIELDS);

/** дефолтные настройки query клиента для страницы списка танков */
export const TANKS_INFINITE_QUERY_KEY = [
  "tanks",
  "infinite",
  { limit: SERVER_LIMIT, fields: TANK_FIELDS_PARAM },
] as const;

/** начальная страница списка */
export const DEFAULT_PAGE = 1;

/** дефолтное количество элементов на странице */
export const DEFAULT_PAGE_SIZE = 10;

/** время актуальности кеша запроса */
export const TANK_STALE_TIME = 600000; //10мин
