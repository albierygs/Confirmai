import z from "zod";

export const adicionarAoCarrinhoSchema = z.object({
  request: z
    .object({
      batchTicketId: z
        .uuid("O campo 'batchTicketId' deve ser um UUID")
        .nonoptional("O campo 'batchTicketId' é obrigatório")
        .openapi({ description: "O UUID do ingresso" }),
      quantity: z
        .int("O campo 'quantity' deve ser um número inteiro")
        .min(0, "O campo 'quantity' deve ser no mínimo 0")
        .nonoptional("O campo 'quantity' é obrigatório")
        .openapi({
          description: "A quantidade que será adicionada ao carrinho",
          example: 2,
        }),
    })
    .strict(),

  response: z.object({
    success: z.boolean().openapi({
      description: "Se a reserva foi feita com sucesso",
      example: true,
    }),
    reservation: z.object({
      id: z.uuid().openapi({ description: "ID da reserva" }),
      quantity: z.int().openapi({
        description: "A quantidade adicionada ao carrinho",
        example: 2,
      }),
      expiresAt: z
        .date()
        .openapi({ description: "Data e hora de expiração da reserva" }),
    }),
  }),
});

export type AdicionarAoCarrinhoRequestSchema = z.infer<
  typeof adicionarAoCarrinhoSchema.shape.request
>;

export type AdicionarAoCarrinhoResponseSchema = z.infer<
  typeof adicionarAoCarrinhoSchema.shape.response
>;
