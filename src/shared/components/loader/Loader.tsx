import { useIsFetching } from "@tanstack/react-query";
import "./Loader.scss";

/**
 * UI-компонент индикатора загрузки.
 *
 * Показывает/скрывает лоадер в зависимости от количества активных запросов,
 * которое возвращает useIsFetching() (TanStack Query).
 *
 * Логика:
 * - если fetchCount > 0 — добавляет класс "is-visible" на контейнер;
 * - если fetchCount === 0 — лоадер считается скрытым (класс не добавляется).
 *
 * Доступность (a11y):
 * - внутренний элемент имеет role="progressbar" и aria-label="Загрузка".
 *
 * @returns {JSX.Element} React-элемент лоадера.
 */
export const Loader = () => {
  const fetchCount = useIsFetching();
  // P.S. если класов будет много, то стоит установить библиотеку classnames или аналог
  return (
    <div className={`loader-container ${fetchCount > 0 ? "is-visible" : ""}`}>
      <div className="loader" role="progressbar" aria-label="Загрузка" />
    </div>
  );
};
