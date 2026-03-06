import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { PAGINATION_PAGE_SIZES, SEARCH_QUERY_MAX_LEN, SEARCH_QUERY_MIN_LEN } from "../constants";
import { trimStringLength } from "../utils/trim-string-length";
import "./Header.scss";

/**
 * Пропсы компонента Header.
 *
 * @typedef HeaderProps
 * @property {(query: string) => () => void} handleSearchClick
 * Функция-фабрика обработчика поиска.
 * Принимает текущую строку поиска и возвращает callback, который можно передать в onClick.
 * Важно: в некоторых местах (например, по Enter) этот callback вызывается вручную: handleSearchClick(query)().
 *
 * @property {() => void} handleSearchClear
 * Вызывается при очистке поиска (кнопка "×"). Обычно синхронизирует состояние поиска с URL/стором/кешем.
 *
 * @property {(e: ChangeEvent<HTMLSelectElement>) => void} handlePageSizeChange
 * Обработчик изменения размера страницы (select).
 *
 * @property {string} qFromUrl
 * Значение поискового запроса, пришедшее извне (например из URL).
 * Используется для инициализации и синхронизации локального состояния search.
 */
type HeaderProps = {
  handleSearchClick: (string: string) => () => void;
  handleSearchClear: () => void;
  handlePageSizeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  qFromUrl: string;
};

/**
 * Header — шапка страницы с поиском и выбором размера страницы.
 *
 * Возможности:
 * - Хранит локальное состояние строки поиска (search), инициализируя из qFromUrl.
 * - Синхронизирует search при изменении qFromUrl.
 * - Ограничивает длину введенного запроса через trimStringLength до SEARCH_QUERY_MAX_LEN.
 * - Показывает кнопку очистки, если search.trim().length > 0.
 * - Блокирует поиск и выбор page size во время активных запросов (useIsFetching() > 0).
 *
 * Запуск поиска:
 * - По Enter: если кнопка поиска не disabled, вызывает handleSearchClick(search)().
 * - По клику: onClick получает функцию, возвращаемую handleSearchClick(search).
 *
 * @param props Пропсы Header.
 * @returns React-элемент шапки.
 */
export const Header = ({
  handleSearchClick,
  handleSearchClear,
  handlePageSizeChange,
  qFromUrl,
}: HeaderProps) => {
  const fetchingCount = useIsFetching();
  const [search, setSearch] = useState<string>(qFromUrl ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch((prev) => qFromUrl ?? prev);
  }, [qFromUrl]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(() => trimStringLength(e.target.value, SEARCH_QUERY_MAX_LEN));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !buttonDisabled) handleSearchClick(search)();
  };

  const handleClearClick = () => {
    setSearch("");
    handleSearchClear();
  };

  const buttonDisabled =
    search.length < SEARCH_QUERY_MIN_LEN ||
    search.length > SEARCH_QUERY_MAX_LEN ||
    fetchingCount > 0;

  const clearVisible = search.trim().length > 0;

  return (
    <header className="header">
      <div className="header__content">
        <h1>Танковедение</h1>

        <div className="header__search">
          <div className="header__search__input-wrap">
            {/* P.S. если много полей ввода или контролов - лучше использовать библиотеки по типу react-hook-form */}
            <input
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              type="search"
              inputMode="search"
              minLength={SEARCH_QUERY_MIN_LEN}
              maxLength={SEARCH_QUERY_MAX_LEN}
              results={5}
              className="header__search__input"
              placeholder="Поиск по названию"
              required
            />

            {clearVisible && (
              <button
                type="button"
                aria-label="Очистить поиск"
                className="header__search__clear"
                onClick={handleClearClick}
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="header__search__button"
            disabled={buttonDisabled}
            onClick={handleSearchClick(search)}
          />
        </div>

        <select
          className="header__select"
          onChange={handlePageSizeChange}
          disabled={fetchingCount > 0}
        >
          {PAGINATION_PAGE_SIZES.map((size) => (
            <option key={size} value={String(size)}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
};
