import z from "zod";

const planSchema = z
  .object({
    id: z.uuid().openapi({ description: "ID (UUID) do plano" }),
    name: z
      .string()
      .openapi({ description: "Nome do plano", example: "Mensal" }),
    slug: z
      .string()
      .openapi({ description: "Slug do plano", example: "mensal" }),
    description: z.string().nullable().openapi({
      description: "Descrição do plano",
      example: "Plano mensal com acesso completo",
    }),
    interval: z.enum(["MONTHLY", "YEARLY"]).openapi({
      description: "Intervalo de cobrança",
      example: "MONTHLY",
    }),
    price: z.number().openapi({
      description: "Preço do plano em BRL",
      example: 20.0,
    }),
    isActive: z.boolean().openapi({
      description: "Se o plano está ativo",
      example: true,
    }),
    createdAt: z.date().openapi({ description: "Data de criação" }),
    updatedAt: z.date().openapi({ description: "Data de atualização" }),
  })
  .strict();

export type PlanSchema = z.infer<typeof planSchema>;

export default planSchema;
