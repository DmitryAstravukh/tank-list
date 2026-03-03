import { TANK_REQUEST_FIELDS } from "@/entities/tank/constants";
import { buildFieldsParam } from "./utils";
import { getTableColumns } from "./utils";

export const TankList = () => {
  const columns = getTableColumns(TANK_REQUEST_FIELDS);
  const fieldsQueryParam = buildFieldsParam(TANK_REQUEST_FIELDS);

  console.log("columns", columns);
  console.log("fieldsQueryParam", fieldsQueryParam);

  /*
    // Запрос
const url = `https://api.tanki.su/wot/encyclopedia/vehicles/?fields=${fieldsParam}`;
const raw = await fetch(url).then((r) => r.json());

// Валидация — бросит ошибку если структура не совпадает
const response = ApiResponseTankSelectedFieldsSchema.parse(raw);
    */

  return null;
};
