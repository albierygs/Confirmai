import { z } from "zod";

const paymentMethodSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  gatewayFeePercent: z.number(),
  gatewayFeeFixed: z.number(),
  allowInstallments: z.boolean(),
  maxInstallments: z.number(),
  minInstallmentValue: z.number(),
  interestFree: z.number(),
  interestRate: z.number(),
  isActive: z.boolean(),
});

export type PaymentMethodSchema = z.infer<typeof paymentMethodSchema>;
export default paymentMethodSchema;
