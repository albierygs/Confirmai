import z from "zod";

export const buscarCarrinhoSchema = z.object({
  response: z.object({
    items: z
      .object({
        reservationId: z.uuid().openapi({ description: "ID da reserva" }),
        batchTicketId: z.uuid().openapi({ description: "ID do ingresso" }),
        eventName: z.string().openapi({
          description: "Nome do evento",
          example: "Encontro Tecno",
        }),
        batchName: z
          .string()
          .openapi({ description: "Nome do lote", example: "1° lote" }),
        ticketType: z
          .string()
          .openapi({ description: "Tipo do ingresso", example: "Inteira" }),
        quantity: z.int().openapi({
          description: "Qauntidade de ingressos reservados",
          example: 2,
        }),
        pricePerUnit: z.number().openapi({
          description: "Preço da unidade do ingresso",
          example: 25.0,
        }),
        subtotal: z
          .number()
          .openapi({ description: "Preço total dos ingressos", example: 50.0 }),
        expiresAt: z.date().openapi({
          description: "Data de expiração da reserva",
          example: new Date(),
        }),
      })
      .array(),

    total: z.number().openapi({
      description: "Preço total dos ingressos reservados",
      example: 75.5,
    }),
  }),
});

export type BuscarCarrinhoResponseSchema = z.infer<
  typeof buscarCarrinhoSchema.shape.response
>;
