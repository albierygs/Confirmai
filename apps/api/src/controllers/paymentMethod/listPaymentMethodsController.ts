import { RequestHandler } from "express";
import {
  ListPaymentMethodsQuerySchema,
  ListPaymentMethodsResponseSchema,
} from "../../schemas/payment/listPaymentMethodsSchema";
import { getPaymentProvider } from "../../services/payment/getPaymentProvider";

const listPaymentMethods: RequestHandler<
  any,
  ListPaymentMethodsResponseSchema,
  any,
  ListPaymentMethodsQuerySchema
> = async (req, res) => {
  const { provider = "stripe" } = req.query;

  const paymentProvider = await getPaymentProvider(provider as string);

  return res.json({
    provider: {
      slug: paymentProvider.slug,
      platformFeePercent: paymentProvider.platformFeePercent.toNumber(),
    },
    methods: paymentProvider.paymentMethods.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      gatewayFeePercent: m.gatewayFeePercent.toNumber(),
      gatewayFeeFixed: m.gatewayFeeFixed.toNumber(),
      allowInstallments: m.allowInstallments,
      maxInstallments: m.maxInstallments,
      minInstallmentValue: m.minInstallmentValue.toNumber(),
      interestFree: m.interestFree,
      interestRate: m.interestRate.toNumber(),
      isActive: m.isActive,
    })),
  });
};

export default listPaymentMethods;
