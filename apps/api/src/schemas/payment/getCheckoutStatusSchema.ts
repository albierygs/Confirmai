import { z } from "zod";
import eventoSchema from "../eventos/eventoSchema";

const getCheckoutStatusSchema = z.object({
  params: z.object({
    orderId: z.uuid("ID do pedido inválido").openapi({
      description: "ID do tipo de ingresso",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  }),

  response: z.object({
    id: z.uuid(),
    status: z.enum([
      "PENDING",
      "PAID",
      "FAILED",
      "CANCELED",
      "EXPIRED",
      "REFUNDED",
      "PROCESSING",
      "PARTIAL_REFUND",
      "CONFIRMED",
    ]),
    events: eventoSchema.array(),
    items: z
      .object({
        eventName: z.string(),
        batchName: z.string(),
        ticketType: z.string(),
        quantity: z.int(),
        price: z.number(),
        total: z.number(),
      })
      .array(),
    subtotal: z.number(),
    platformFee: z.number(),
    total: z.number(),
    paidAt: z.date().nullable(),
    createdAt: z.date(),
  }),
});

export type GetCheckoutStatusParamsSchema = z.infer<
  typeof getCheckoutStatusSchema.shape.params
>;

export type GetCheckoutStatusResponseSchema = z.infer<
  typeof getCheckoutStatusSchema.shape.response
>;

export default getCheckoutStatusSchema;
