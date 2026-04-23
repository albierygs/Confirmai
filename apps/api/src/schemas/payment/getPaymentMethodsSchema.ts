import { z } from "zod";

const getPaymentMethodsSchema = z.object({
  params: z.object({
    tenantSlug: z.string().min(1),
  }),

  query: z.object({
    provider: z.string().optional().default("stripe").openapi({
      description: "Slug do provider",
      example: "stripe",
    }),
  }),

  response: z.object({
    provider: z.string(),
    methods: z.array(
      z.object({
        slug: z.string(),
        name: z.string(),
        allowInstallments: z.boolean(),
        maxInstallments: z.number(),
        interestFree: z.number(),
        gatewayFees: z.object({
          percent: z.string(),
          fixed: z.string(),
        }),
      }),
    ),
  }),
});

export type GetPaymentMethodsParamsSchema = z.infer<
  typeof getPaymentMethodsSchema.shape.params
>;

export type GetPaymentMethodsQuerySchema = z.infer<
  typeof getPaymentMethodsSchema.shape.query
>;

export type GetPaymentMethodsResponseSchema = z.infer<
  typeof getPaymentMethodsSchema.shape.response
>;

export default getPaymentMethodsSchema;
