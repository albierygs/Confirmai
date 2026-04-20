import Decimal from "decimal.js";
import { z } from "zod";

const installmentOptionSchema = z.object({
  number: z.number().int().positive(),
  value: z.number().positive(),
  total: z.number().positive(),
  interestRate: z.number().min(0),
  hasInterest: z.boolean(),
});

const calculateFeesSchema = z.object({
  request: z.object({
    providerSlug: z
      .string()
      .min(1, "Provider é obrigatório")
      .optional()
      .default("stripe")
      .openapi({
        description: "Slug do provider de pagamento",
        example: "stripe",
      }),

    paymentMethodSlug: z
      .string()
      .min(1, "Método de pagamento é obrigatório")
      .openapi({
        description: "Slug do método de pagamento",
        example: "credit_card",
      }),

    subtotal: z
      .number()
      .positive("Subtotal deve ser maior que zero")
      .transform((n) => new Decimal(n))
      .openapi({
        description: "Valor total dos ingressos",
        example: 100.0,
      }),
  }),

  response: z.object({
    subtotal: z.number(),
    platformFee: z.number(),
    gatewayFee: z.number(),
    tenantReceives: z.number(),
    total: z.number(),
    installments: z.array(installmentOptionSchema).optional(),
  }),
});

export type CalculateFeesRequestSchema = z.infer<
  typeof calculateFeesSchema.shape.request
>;

export type CalculateFeesResponseSchema = z.infer<
  typeof calculateFeesSchema.shape.response
>;

export default calculateFeesSchema;
