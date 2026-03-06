import { SERVER_LIMIT, TANK_FIELDS_PARAM } from "../constants";
import { ApiResponseTankSelectedFieldsSchema } from "../schema";
import type { ApiResponseTankSelectedFields, RequestedTank } from "../types";

export type TanksPage = {
  meta: ApiResponseTankSelectedFields["meta"];
  items: RequestedTank[];
};

export async function fetchTanksPage(args: {
  pageParam?: number;
  signal?: AbortSignal;
}): Promise<TanksPage> {
  const page = args.pageParam ?? 1;

  const url =
    `${import.meta.env.VITE_API_URL}?${import.meta.env.VITE_API_APPLICATION_ID}` +
    `&page_no=${page}` +
    `&limit=${SERVER_LIMIT}` +
    `&fields=${encodeURIComponent(TANK_FIELDS_PARAM)}`;

  const res = await fetch(url, { signal: args.signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const raw = await res.json();

  // Zod-валидация (бросит исключение при неверном контракте)
  const parsed = ApiResponseTankSelectedFieldsSchema.parse(raw);

  if (parsed.status !== "ok") {
    throw new Error("API returned status=error");
  }

  // data: Record<string, RequestedTank> -> RequestedTank[]
  const items = Object.values(parsed.data ?? {});

  return { meta: parsed.meta, items };
}
