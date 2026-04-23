import { z } from "zod";

const createCheckoutSchema = z.object({
  request: z.object({}).strict(),

  response: z.object({
    orderId: z.uuid(),
    url: z.url(),
    amount: z.number(),
    expiresAt: z.date(),
  }),
});

export type CreateCheckoutRequestSchema = z.infer<
  typeof createCheckoutSchema.shape.request
>;

export type CreateCheckoutResponseSchema = z.infer<
  typeof createCheckoutSchema.shape.response
>;

export default createCheckoutSchema;
