import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// чтобы не падать на импорте стилей
vi.mock("./TankListPage.scss", () => ({}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let headerProps: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tableProps: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let paginationProps: any;

// Мокаем дочерние компоненты, чтобы проверить прокидывание пропсов
vi.mock("./header/Header", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Header: (props: any) => {
    headerProps = props;
    return <div data-testid="Header" />;
  },
}));

vi.mock("./table/Table", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table: (props: any) => {
    tableProps = props;
    return <div data-testid="Table" />;
  },
}));

vi.mock("./pagination/Pagination", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Pagination: (props: any) => {
    paginationProps = props;
    return <div data-testid="Pagination" />;
  },
}));

// Мок хука-контроллера
const useTanksBrowserControllerMock = vi.fn();

vi.mock("./hooks", () => ({
  useTanksBrowserController: () => useTanksBrowserControllerMock(),
}));

import { TankListPage } from "./TankListPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let controller: any;

describe("TankListPage", () => {
  beforeEach(() => {
    headerProps = undefined;
    tableProps = undefined;
    paginationProps = undefined;

    useTanksBrowserControllerMock.mockReset();

    controller = {
      qFromUrl: "tiger",
      currentPage: 2,
      pageSize: 25,
      totalItems: 123,

      handlePageChange: vi.fn(),
      handlePageSizeChange: vi.fn(),
      handleSearchClick: vi.fn(),
      handleSearchClear: vi.fn(),

      rows: [{ id: 1, name: "Tiger I" }],
      foundTankId: 1,
      notFound: undefined,
    };

    useTanksBrowserControllerMock.mockReturnValue(controller);
  });

  it("вызывает useTanksBrowserController один раз при рендере", () => {
    render(<TankListPage />);
    expect(useTanksBrowserControllerMock).toHaveBeenCalledTimes(1);
  });

  it("рендерит Header, Table, Pagination", () => {
    render(<TankListPage />);

    expect(screen.getByTestId("Header")).toBeInTheDocument();
    expect(screen.getByTestId("Table")).toBeInTheDocument();
    expect(screen.getByTestId("Pagination")).toBeInTheDocument();
  });

  it('рендерит секцию-обёртку с className="tank-list" и aria-label="Таблица танков"', () => {
    render(<TankListPage />);

    // <section aria-label="..."> имеет роль "region"
    const region = screen.getByRole("region", { name: "Таблица танков" });
    expect(region).toBeInTheDocument();
    expect(region).toHaveClass("tank-list");
  });

  it("прокидывает корректные пропсы в Header", () => {
    render(<TankListPage />);

    expect(headerProps).toBeTruthy();
    expect(headerProps.qFromUrl).toBe("tiger");
    expect(typeof headerProps.handleSearchClick).toBe("function");
    expect(typeof headerProps.handleSearchClear).toBe("function");
    expect(typeof headerProps.handlePageSizeChange).toBe("function");
  });

  it("прокидывает корректные пропсы в Table", () => {
    render(<TankListPage />);

    expect(tableProps).toBeTruthy();
    expect(tableProps.rows).toEqual([{ id: 1, name: "Tiger I" }]);
    expect(tableProps.foundTankId).toBe(1);
  });

  it("прокидывает корректные пропсы в Pagination", () => {
    render(<TankListPage />);

    expect(paginationProps).toBeTruthy();
    expect(paginationProps.currentPage).toBe(2);
    expect(paginationProps.totalItems).toBe(123);
    expect(paginationProps.pageSize).toBe(25);
    expect(typeof paginationProps.handlePageChange).toBe("function");
  });

  it("прокинутые хендлеры — это те же функции из контроллера (и они вызываются)", () => {
    render(<TankListPage />);

    expect(headerProps.handleSearchClick).toBe(controller.handleSearchClick);
    expect(headerProps.handleSearchClear).toBe(controller.handleSearchClear);
    expect(headerProps.handlePageSizeChange).toBe(controller.handlePageSizeChange);
    expect(paginationProps.handlePageChange).toBe(controller.handlePageChange);

    headerProps.handleSearchClick("kv-1");
    headerProps.handleSearchClear();
    headerProps.handlePageSizeChange(50);
    paginationProps.handlePageChange(3);

    expect(controller.handleSearchClick).toHaveBeenCalledWith("kv-1");
    expect(controller.handleSearchClear).toHaveBeenCalledTimes(1);
    expect(controller.handlePageSizeChange).toHaveBeenCalledWith(50);
    expect(controller.handlePageChange).toHaveBeenCalledWith(3);
  });

  it('когда notFound — строка: показывает сообщение "Не найдено :(" и не рендерит таблицу/пагинацию', () => {
    controller.notFound = "tiger-999";
    useTanksBrowserControllerMock.mockReturnValue(controller);

    render(<TankListPage />);

    // Header всегда есть
    expect(screen.getByTestId("Header")).toBeInTheDocument();

    // Появляется сообщение not found
    const msg = screen.getByText("Не найдено :(");
    expect(msg).toBeInTheDocument();
    expect(msg).toHaveClass("tank-not-found");

    // Секция таблицы не должна появляться
    expect(screen.queryByRole("region", { name: "Таблица танков" })).not.toBeInTheDocument();

    // И дочерние компоненты, которые внутри секции, тоже не должны рендериться
    expect(screen.queryByTestId("Table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("Pagination")).not.toBeInTheDocument();
  });

  it("когда notFound не строка: рендерит таблицу и пагинацию и не показывает сообщение", () => {
    controller.notFound = undefined; // или null / false / {}
    useTanksBrowserControllerMock.mockReturnValue(controller);

    render(<TankListPage />);

    expect(screen.getByTestId("Header")).toBeInTheDocument();

    expect(screen.queryByText("Не найдено :(")).not.toBeInTheDocument();

    expect(screen.getByRole("region", { name: "Таблица танков" })).toBeInTheDocument();
    expect(screen.getByTestId("Table")).toBeInTheDocument();
    expect(screen.getByTestId("Pagination")).toBeInTheDocument();
  });

  it("когда notFound равен пустой строке: всё равно считается notFound-веткой (потому что typeof === string)", () => {
    controller.notFound = "";
    useTanksBrowserControllerMock.mockReturnValue(controller);

    render(<TankListPage />);

    expect(screen.getByText("Не найдено :(")).toBeInTheDocument();
    expect(screen.queryByTestId("Table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("Pagination")).not.toBeInTheDocument();
  });
});
