import { useIsFetching } from "@tanstack/react-query";
import { usePagination } from "./hooks/use-pagination";
import "./Pagination.scss";
import { getTotalPages } from "./utils";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  handlePageChange: (page: number) => void;
};

/**
 * Pagination — навигация по страницам списка.
 *
 * Входные данные:
 * - currentPage: текущая страница (1-based).
 * - totalItems: общее число элементов.
 * - pageSize: размер страницы.
 * - handlePageChange: колбэк смены страницы (получает номер страницы).
 *
 * Поведение:
 * - Считает totalPages через getTotalPages(totalItems, pageSize).
 * - Если totalPages <= 1, ничего не рендерит (возвращает null).
 * - Строит диапазон пагинации через usePagination(...) (может содержать числа и "..." для пропусков).
 * - Во время активных запросов (useIsFetching() > 0) блокирует все кнопки.
 *
 * Доступность (a11y):
 * - nav имеет role="navigation" и aria-label="Пагинация".
 * - у кнопок есть aria-label ("Предыдущая страница", "Следующая страница", "Страница N"),
 *   у активной страницы aria-current="page".
 */

export const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  handlePageChange,
}: PaginationProps) => {
  const fetchingCount = useIsFetching();

  const paginationRange = usePagination({
    currentPage,
    totalItems,
    pageSize,
  });

  const totalPages = getTotalPages(totalItems, pageSize);

  if (totalPages <= 1) return null;

  const disabled = fetchingCount > 0;

  return (
    <nav className="pagination" aria-label="Пагинация" role="navigation">
      <ul className="pagination__list">
        <li className="pagination__item">
          <button
            className="pagination__button pagination__button--nav"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
            aria-label="Предыдущая страница"
            type="button"
          >
            &laquo;
          </button>
        </li>

        {paginationRange.map((page, index) => {
          if (page === "...") {
            return (
              <li key={`dots-${index}`} className="pagination__item pagination__item--dots">
                <span aria-hidden="true">...</span>
              </li>
            );
          }

          return (
            <li key={page} className="pagination__item">
              <button
                className={`pagination__button ${
                  page === currentPage ? "pagination__button--active" : ""
                }`}
                onClick={() => handlePageChange(Number(page))}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={`Страница ${page}`}
                type="button"
                disabled={disabled}
              >
                {page}
              </button>
            </li>
          );
        })}

        <li className="pagination__item">
          <button
            className="pagination__button pagination__button--nav"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
            aria-label="Следующая страница"
            type="button"
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};
