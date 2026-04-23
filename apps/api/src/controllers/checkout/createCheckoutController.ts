import { RequestHandler } from "express";
import { FRONTEND_URL } from "../../config/constants";
import {
  CreateCheckoutRequestSchema,
  CreateCheckoutResponseSchema,
} from "../../schemas/payment/createCheckoutSchema";
import { createOrder } from "../../services/checkout/createOrder";
import { validateAvailability } from "../../services/checkout/validateAvailability";
import { getPaymentProvider } from "../../services/payment/getPaymentProvider";
import { createCheckoutSession } from "../../services/stripe/createCheckoutSession";
import { generateFrontUrlWithSlug } from "../../utils/generators";

const createCheckout: RequestHandler<
  any,
  CreateCheckoutResponseSchema,
  CreateCheckoutRequestSchema
> = async (req, res) => {
  const providerSlug = "stripe";

  const provider = await getPaymentProvider(providerSlug);

  // Validar disponibilidade a partir da reserva ativa do usuário
  const { reservationId, validatedItems, subtotal } = await validateAvailability(
    req.user!.id,
    req.tenant!.id,
  );

  // Calcular apenas a comissão da plataforma (sem depender do método).
  // O `paymentMethod` será atribuído somente na confirmação do pagamento.
  const platformFeePercent = provider.platformFeePercent.plus(
    provider.platformCoustPercent,
  );
  const platformFee = subtotal.mul(platformFeePercent).div(100);

  // Criar order
  const order = await createOrder({
    tenantId: req.tenant!.id,
    reservationId,
    userId: req.user!.id,
    validatedItems,
    subtotal,
    platformFee,
    paymentProvider: providerSlug,
  });

  const successUrl = `${generateFrontUrlWithSlug(req.tenant!.slug, `${FRONTEND_URL}/checkout/success?order_id=${order.id}`)}`;
  const cancelUrl = `${generateFrontUrlWithSlug(req.tenant!.slug, `${FRONTEND_URL}/checkout/cancel`)}`;

  // Criar Payment Intent no Stripe
  const checkoutSession = await createCheckoutSession(
    order.id,
    successUrl,
    cancelUrl,
  );

  return res.status(201).json({
    orderId: order.id,
    url: checkoutSession.url!,
    amount: subtotal.toNumber(),
    expiresAt: order.expiresAt!,
  });
};

export default createCheckout;
