import z from "zod";

/**
 * Схема валидации мета-данных ответа API.
 * Пагинация: количество элементов, страница, лимит, всего страниц.
 *
 * @see {@link TankApiResponseSchema} — использует эту схему в поле `meta`
 * @see {@link buildApiResponseSchema} — включает эту схему в динамический ответ
 */
export const ResponseMetaSchema = z.object({
  count: z.number(),
  page_total: z.number(),
  total: z.number(),
  limit: z.number(),
  page: z.number(),
});
