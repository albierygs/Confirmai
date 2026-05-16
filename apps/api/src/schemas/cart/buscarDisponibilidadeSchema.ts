import z from "zod";

export const buscarDisponibilidadeSchema = z.object({
  params: z.object({
    batchTicketId: z
      .uuid("O campo 'batchTicketId' deve ser um UUID")
      .nonoptional("O campo 'batchTicketId' é obrigatório")
      .openapi({ description: "O UUID do ingresso" }),
  }),

  response: z.object({
    available: z
      .int()
      .openapi({ description: "Quantidade disponível", example: 23 }),
  }),
});

export type BuscarDisponibilidadeParamsSchema = z.infer<
  typeof buscarDisponibilidadeSchema.shape.params
>;

export type BuscarDisponibilidadeResponseSchema = z.infer<
  typeof buscarDisponibilidadeSchema.shape.response
>;
