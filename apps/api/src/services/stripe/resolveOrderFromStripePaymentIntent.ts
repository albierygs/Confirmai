import { stripe } from "../../config/stripe";
import { prisma } from "../../config/database";

export const resolveOrderFromStripePaymentIntentId = async (
  paymentIntentId: string,
) => {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const orderId = pi.metadata?.orderId;
  if (!orderId) {
    return null;
  }

  return prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });
};

export const getPaymentIntentIdFromCharge = (charge: {
  payment_intent: string | { id: string } | null;
}): string | null => {
  const pi = charge.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
};
