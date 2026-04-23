import { z } from "zod";
import paymentMethodSchema from "./paymentMethodSchema.js";

const listPaymentMethodsSchema = z
  .object({
    query: z.object({
      provider: z.string().optional().default("stripe").openapi({
        description: "Provider de pagamento",
        example: "stripe",
      }),
    }),
    response: z.object({
      provider: z.object({
        slug: z.string(),
        platformFeePercent: z.number(),
      }),
      methods: z.array(paymentMethodSchema),
    }),
  })
  .strict();

export type ListPaymentMethodsQuerySchema = z.infer<
  typeof listPaymentMethodsSchema.shape.query
>;
export type ListPaymentMethodsResponseSchema = z.infer<
  typeof listPaymentMethodsSchema.shape.response
>;

export default listPaymentMethodsSchema;
