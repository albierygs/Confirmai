import { RequestHandler } from "express";
import {
  CalculateFeesRequestSchema,
  CalculateFeesResponseSchema,
} from "../../schemas/payment/calculateFeesSchema";
import { calculateFees } from "../../services/payment/calculateFees";

export const calculatePaymentFees: RequestHandler<
  any,
  CalculateFeesResponseSchema,
  CalculateFeesRequestSchema
> = async (req, res) => {
  const { providerSlug = "stripe", paymentMethodSlug, subtotal } = req.body;

  const result = await calculateFees(providerSlug, paymentMethodSlug, subtotal);

  return res.json({
    subtotal: result.subtotal.toNumber(),
    platformFee: result.platformFee.toNumber(),
    gatewayFee: result.gatewayFee.toNumber(),
    tenantReceives: result.tenantReceives.toNumber(),
    total: result.total.toNumber(),
    installments: result.installments,
  });
};
