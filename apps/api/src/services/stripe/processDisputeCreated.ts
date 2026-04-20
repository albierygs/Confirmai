import Stripe from "stripe";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import {
  getPaymentIntentIdFromCharge,
  resolveOrderFromStripePaymentIntentId,
} from "./resolveOrderFromStripePaymentIntent";

const disputeNoteLine = (dispute: Stripe.Dispute) =>
  `[DISPUTA_STRIPE ${dispute.id}] motivo=${dispute.reason ?? "desconhecido"} em ${new Date().toISOString()}`;

/**
 * Registra chargeback/disputa no pedido (notes), sem alterar estoque.
 * O status do pedido permanece (ex.: PAID) até resolução no Stripe ou reembolso.
 */
export const processDisputeCreated = async (dispute: Stripe.Dispute) => {
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;

  if (!chargeId) {
    console.warn("[Stripe] Disputa sem charge");
    return;
  }

  const charge = await stripe.charges.retrieve(chargeId);
  const paymentIntentId = getPaymentIntentIdFromCharge(charge);
  if (!paymentIntentId) {
    console.warn(`[Stripe] Disputa ${dispute.id}: charge sem payment_intent`);
    return;
  }

  const order = await resolveOrderFromStripePaymentIntentId(paymentIntentId);
  if (!order) {
    console.warn(
      `[Stripe] Pedido não encontrado para disputa (PI ${paymentIntentId})`,
    );
    return;
  }

  const line = disputeNoteLine(dispute);
  if (order.notes?.includes(`[DISPUTA_STRIPE ${dispute.id}]`)) {
    return;
  }

  const notes = order.notes ? `${order.notes}\n${line}` : line;

  await prisma.order.update({
    where: { id: order.id },
    data: { notes },
  });
};
