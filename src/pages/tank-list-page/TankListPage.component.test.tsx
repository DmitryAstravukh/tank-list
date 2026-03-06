import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

// Мок хука-контроллера: ВАЖНО мокать тот же модуль, что импортируется в компоненте
const useTanksMock = vi.hoisted(() => vi.fn());

vi.mock("./hooks/use-tanks", () => ({
  useTanks: () => useTanksMock(),
}));

import { TankListPage } from "./TankListPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let controller: any;

describe("TankListPage", () => {
  beforeEach(() => {
    headerProps = undefined;
    tableProps = undefined;
    paginationProps = undefined;

    useTanksMock.mockReset();

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

    useTanksMock.mockReturnValue(controller);
  });

  it("вызывает useTanks один раз при рендере", () => {
    render(<TankListPage />);
    expect(useTanksMock).toHaveBeenCalledTimes(1);
  });

  it("рендерит Header, Table, Pagination (когда notFound не строка)", () => {
    render(<TankListPage />);

    expect(screen.getByTestId("Header")).toBeInTheDocument();
    expect(screen.getByTestId("Table")).toBeInTheDocument();
    expect(screen.getByTestId("Pagination")).toBeInTheDocument();
  });

  it('рендерит секцию-обёртку с className="tank-list" и aria-label="Таблица танков" (когда notFound не строка)', () => {
    render(<TankListPage />);

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

    // handlePageSizeChange ожидает event, а не число
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headerProps.handlePageSizeChange({ target: { value: "50" } } as any);

    paginationProps.handlePageChange(3);

    expect(controller.handleSearchClick).toHaveBeenCalledWith("kv-1");
    expect(controller.handleSearchClear).toHaveBeenCalledTimes(1);

    expect(controller.handlePageSizeChange).toHaveBeenCalledTimes(1);
    expect(controller.handlePageSizeChange.mock.calls[0][0].target.value).toBe("50");

    expect(controller.handlePageChange).toHaveBeenCalledWith(3);
  });

  it('когда notFound — строка: показывает сообщение "Не найдено :(" и не рендерит таблицу/пагинацию', () => {
    controller.notFound = "tiger-999";
    useTanksMock.mockReturnValue(controller);

    render(<TankListPage />);

    expect(screen.getByTestId("Header")).toBeInTheDocument();

    const msg = screen.getByText("Не найдено :(");
    expect(msg).toBeInTheDocument();
    expect(msg).toHaveClass("tank-not-found");

    expect(screen.queryByRole("region", { name: "Таблица танков" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("Table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("Pagination")).not.toBeInTheDocument();

    // И props от Table/Pagination не должны выставляться
    expect(tableProps).toBeUndefined();
    expect(paginationProps).toBeUndefined();
  });

  it("когда notFound не строка: рендерит таблицу/пагинацию и не показывает сообщение", () => {
    controller.notFound = undefined;
    useTanksMock.mockReturnValue(controller);

    render(<TankListPage />);

    expect(screen.getByTestId("Header")).toBeInTheDocument();
    expect(screen.queryByText("Не найдено :(")).not.toBeInTheDocument();

    expect(screen.getByRole("region", { name: "Таблица танков" })).toBeInTheDocument();
    expect(screen.getByTestId("Table")).toBeInTheDocument();
    expect(screen.getByTestId("Pagination")).toBeInTheDocument();
  });

  it("когда notFound равен пустой строке: это notFound-ветка (typeof notFound === string)", () => {
    controller.notFound = "";
    useTanksMock.mockReturnValue(controller);

    render(<TankListPage />);

    expect(screen.getByText("Не найдено :(")).toBeInTheDocument();
    expect(screen.queryByTestId("Table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("Pagination")).not.toBeInTheDocument();
  });
});
