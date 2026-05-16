import { z } from "zod";

const ticketStatusEnum = z.enum(["VALID", "USED", "CANCELED", "REFUNDED"]);

const listUserTicketsSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1)
      .openapi({ description: "Número da página", example: 1 }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .default(15)
      .openapi({ description: "Itens por página", example: 15 }),
  }),

  response: z.object({
    tickets: z
      .object({
        id: z.uuid().openapi({ description: "ID do ticket" }),
        hash: z.string().openapi({
          description: "Hash único para QR Code",
          example: "a1b2c3d4e5f6",
        }),
        status: ticketStatusEnum.openapi({ description: "Status do ticket" }),
        price: z.number().openapi({
          description: "Preço pago pelo ingresso",
          example: 50.0,
        }),
        eventName: z.string().openapi({
          description: "Nome do evento",
          example: "Show de Música",
        }),
        eventDate: z.date().openapi({ description: "Data do evento" }),
        batchName: z.string().openapi({
          description: "Nome do lote",
          example: "1° Lote",
        }),
        ticketType: z.string().openapi({
          description: "Tipo do ingresso",
          example: "Inteira",
        }),
        checkedInAt: z
          .date()
          .nullable()
          .openapi({ description: "Data de check-in" }),
        createdAt: z.date().openapi({ description: "Data de emissão" }),
      })
      .array(),
    pagination: z.object({
      page: z.int().openapi({ description: "Página atual", example: 1 }),
      limit: z.int().openapi({ description: "Itens por página", example: 15 }),
      total: z
        .int()
        .openapi({ description: "Total de registros", example: 42 }),
      totalPages: z
        .int()
        .openapi({ description: "Total de páginas", example: 3 }),
    }),
  }),
});

export type ListUserTicketsQuerySchema = z.infer<
  typeof listUserTicketsSchema.shape.query
>;

export type ListUserTicketsResponseSchema = z.infer<
  typeof listUserTicketsSchema.shape.response
>;

export default listUserTicketsSchema;
