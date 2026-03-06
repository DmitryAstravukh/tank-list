import { describe, it, expect } from "vitest";
import { dedupeByTankIdKeepOrder } from "./index";
import { RequestedTank } from "../../types";

describe("dedupeByTankIdKeepOrder", () => {
  it("возвращает пустой массив для пустого ввода", () => {
    expect(dedupeByTankIdKeepOrder([])).toEqual([]);
  });

  it("не удаляет элементы, если все tank_id уникальны", () => {
    const a = { tank_id: 1, name: "A" } as RequestedTank;
    const b = { tank_id: 2, name: "B" } as RequestedTank;
    const c = { tank_id: 3, name: "C" } as RequestedTank;

    const res = dedupeByTankIdKeepOrder([a, b, c]);

    expect(res).toEqual([a, b, c]);
  });

  it("удаляет дубликаты по tank_id и сохраняет порядок первого появления", () => {
    const a1 = { tank_id: 1, name: "A1" } as RequestedTank;
    const b = { tank_id: 2, name: "B" } as RequestedTank;
    const a2 = { tank_id: 1, name: "A2" } as RequestedTank;
    const c = { tank_id: 3, name: "C" } as RequestedTank;

    const res = dedupeByTankIdKeepOrder([a1, b, a2, c]);

    expect(res).toEqual([a1, b, c]);
  });

  it("оставляет именно первый встретившийся объект (сохраняет ссылку)", () => {
    const first = { tank_id: 10, name: "First" } as RequestedTank;
    const second = { tank_id: 10, name: "Second" } as RequestedTank;

    const res = dedupeByTankIdKeepOrder([first, second]);

    expect(res).toHaveLength(1);
    // проверяем, что оставили первый объект, а не перезаписали
    expect(res[0]).toBe(first);
  });

  it("корректно работает, если дубликаты не подряд", () => {
    const a1 = { tank_id: 1, name: "A1" } as RequestedTank;
    const b = { tank_id: 2, name: "B" } as RequestedTank;
    const c = { tank_id: 3, name: "C" } as RequestedTank;
    const a2 = { tank_id: 1, name: "A2" } as RequestedTank;
    const b2 = { tank_id: 2, name: "B2" } as RequestedTank;

    const res = dedupeByTankIdKeepOrder([a1, b, c, a2, b2]);

    expect(res).toEqual([a1, b, c]);
  });

  it("не мутирует исходный массив", () => {
    const a1 = { tank_id: 1, name: "A1" } as RequestedTank;
    const b = { tank_id: 2, name: "B" } as RequestedTank;
    const a2 = { tank_id: 1, name: "A2" } as RequestedTank;

    const src = [a1, b, a2];
    const snapshot = src.slice();

    const res = dedupeByTankIdKeepOrder(src);

    // исходный массив не изменился
    expect(src).toEqual(snapshot);

    // результат — новый массив
    expect(res).not.toBe(src);

    // корректная дедупликация
    expect(res).toEqual([a1, b]);
  });

  it("корректно обрабатывает отрицательные и нулевые tank_id (как обычные числа)", () => {
    const a = { tank_id: 0, name: "Zero" } as RequestedTank;
    const b = { tank_id: -1, name: "Minus" } as RequestedTank;
    const a2 = { tank_id: 0, name: "Zero2" } as RequestedTank;

    const res = dedupeByTankIdKeepOrder([a, b, a2]);

    expect(res).toEqual([a, b]);
  });
});
