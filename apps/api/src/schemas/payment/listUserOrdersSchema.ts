import { z } from "zod";

const orderStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "PAID",
  "CONFIRMED",
  "EXPIRED",
  "FAILED",
  "CANCELED",
  "REFUNDED",
  "PARTIAL_REFUND",
]);

const listUserOrdersSchema = z.object({
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
    orders: z
      .object({
        id: z.uuid().openapi({ description: "ID do pedido" }),
        status: orderStatusEnum.openapi({ description: "Status do pedido" }),
        subtotal: z
          .number()
          .openapi({ description: "Subtotal do pedido", example: 100.0 }),
        platformFee: z
          .number()
          .openapi({ description: "Taxa da plataforma", example: 10.0 }),
        total: z
          .number()
          .openapi({ description: "Total do pedido", example: 100.0 }),
        paymentMethod: z
          .string()
          .nullable()
          .openapi({ description: "Método de pagamento", example: "PIX" }),
        paidAt: z
          .date()
          .nullable()
          .openapi({ description: "Data de pagamento" }),
        createdAt: z.date().openapi({ description: "Data de criação" }),
        items: z
          .object({
            eventName: z
              .string()
              .openapi({ description: "Nome do evento", example: "Show" }),
            batchName: z
              .string()
              .openapi({ description: "Nome do lote", example: "1° Lote" }),
            ticketType: z.string().openapi({
              description: "Tipo do ingresso",
              example: "Inteira",
            }),
            quantity: z
              .int()
              .openapi({ description: "Quantidade", example: 2 }),
            price: z.number().openapi({
              description: "Preço unitário",
              example: 50.0,
            }),
            total: z
              .number()
              .openapi({ description: "Total do item", example: 100.0 }),
          })
          .array(),
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

export type ListUserOrdersQuerySchema = z.infer<
  typeof listUserOrdersSchema.shape.query
>;

export type ListUserOrdersResponseSchema = z.infer<
  typeof listUserOrdersSchema.shape.response
>;

export default listUserOrdersSchema;
