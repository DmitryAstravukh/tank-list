import "./TankListPage.scss";
import { Header } from "./header/Header";
import { Pagination } from "./pagination/Pagination";
import { Table } from "./table/Table";
import { useTanks } from "./hooks";

/**
 * TankListPage — страница просмотра списка танков с поиском и пагинацией.
 *
 * Компонент:
 * - получает состояние и обработчики из useTanksBrowserController();
 * - рендерит Header (поиск/очистка/смена размера страницы);
 * - рендерит секцию с таблицей и пагинацией:
 *   - Table получает rows и foundTankId;
 *   - Pagination получает currentPage, totalItems, pageSize, handlePageChange.
 *
 * Доступность:
 * - таблица с пагинацией обёрнуты в <section class="tank-list" aria-label="Таблица танков">,
 *   что даёт доступный landmark role="region" с именем "Таблица танков".
 *
 * @returns React-элемент страницы списка танков.
 */
export const TankListPage = () => {
  const {
    qFromUrl,
    currentPage,
    pageSize,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
    handleSearchClick,
    handleSearchClear,
    rows,
    foundTankId,
    notFound,
  } = useTanks();

  return (
    <>
      <Header
        qFromUrl={qFromUrl}
        handleSearchClick={handleSearchClick}
        handleSearchClear={handleSearchClear}
        handlePageSizeChange={handlePageSizeChange}
      />

      {typeof notFound === "string" ? (
        <p className="tank-not-found">Не найдено :(</p>
      ) : (
        <section className="tank-list" aria-label="Таблица танков">
          {/* P.S. можно еще при загрузке добавить скелетон, чтобы таблица не прыгала */}
          <Table rows={rows} foundTankId={foundTankId} />

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            handlePageChange={handlePageChange}
          />
        </section>
      )}
    </>
  );
};
