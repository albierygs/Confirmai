import z from "zod";

export const removerDoCarrinhoSchema = z.object({
  request: z.object({
    batchTicketId: z
      .uuid("O campo 'batchTicketId' deve ser um UUID")
      .nonoptional("O campo 'batchTicketId' é obrigatório")
      .openapi({ description: "O UUID do ingresso" }),
  }),

  response: z.object({
    success: z.boolean().openapi({
      description: "Se a reserva foi cancelada",
      example: true,
    }),
    cancelled: z.boolean().openapi({
      description: "Se a reserva foi cancelada",
      example: true,
    }),
  }),
});

export type RemoverDoCarrinhoRequestSchema = z.infer<
  typeof removerDoCarrinhoSchema.shape.request
>;

export type RemoverDoCarrinhoResponseSchema = z.infer<
  typeof removerDoCarrinhoSchema.shape.response
>;
