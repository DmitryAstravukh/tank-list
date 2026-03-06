import type { RequestedTank, TankRequestedField } from "@/pages/tank-list-page/types";
import "./TableCell.scss";

type TableCell = {
  data: RequestedTank;
  fieldName: TankRequestedField;
  className?: string;
};

/**
 * TableCell — ячейка таблицы со значением конкретного поля танка.
 *
 * Берёт значение из data[fieldName] и отображает его в <div class="table__cell">.
 *
 * Ветвления отображения:
 * - fieldName === "name" и data.is_premium === true:
 *   добавляет модификатор "table__cell--premium", выводит значение как строку,
 *   устанавливает title в строковое значение.
 *
 * - fieldName === "is_premium":
 *   отображает "Да" для true и "Нет" для false,
 *   устанавливает title в "true" / "false".
 *
 * - fieldName === "price_credit":
 *   - если значение null или undefined → показывает "—" (без title);
 *   - иначе → добавляет "table__cell--numeric",
 *     форматирует число через toLocaleString("ru-RU"),
 *     устанавливает title в исходное строковое значение.
 *
 * - любое другое поле:
 *   выводит String(value) и ставит title={String(value)}.
 *
 * Классы:
 * - базовый: "table__cell"
 * - опционально добавляет className из пропсов (если передан)
 *
 * @param props - Пропсы компонента.
 * @param props.data - Объект танка (источник данных).
 * @param props.fieldName - Имя поля (ключ в data), которое нужно отобразить.
 * @param props.className - Дополнительный CSS-класс(ы) для ячейки.
 * @returns React-элемент ячейки таблицы.
 */
export const TableCell = ({ data, fieldName, className }: TableCell) => {
  const value = data[fieldName];

  if (fieldName === "name" && data.is_premium) {
    return (
      <div className={`table__cell table__cell--premium ${className ?? ""}`} title={String(value)}>
        {" "}
        {String(value)}
      </div>
    );
  }

  if (fieldName === "is_premium") {
    return (
      <div className={`table__cell ${className ?? ""}`} title={String(value)}>
        {value ? "Да" : "Нет"}
      </div>
    );
  }

  if (fieldName === "price_credit") {
    if (value == null) return <div className={`table__cell ${className ?? ""}`}>—</div>;
    return (
      <div className={`table__cell table__cell--numeric ${className ?? ""}`} title={String(value)}>
        {Number(value).toLocaleString("ru-RU")}
      </div>
    );
  }

  return (
    <div className={`table__cell ${className ?? ""}`} title={String(value)}>
      {String(value)}
    </div>
  );
};
