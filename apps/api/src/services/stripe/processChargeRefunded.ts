import Stripe from "stripe";
import { prisma } from "../../config/database";
import {
  getPaymentIntentIdFromCharge,
  resolveOrderFromStripePaymentIntentId,
} from "./resolveOrderFromStripePaymentIntent";

/**
 * Reembolso total: marca pedido e devolve ingressos ao estoque (soldQuantity).
 * Reembolso parcial: apenas status e timestamp; estoque não é alterado (sem detalhe por linha no Stripe).
 */
export const processChargeRefunded = async (charge: Stripe.Charge) => {
  const paymentIntentId = getPaymentIntentIdFromCharge(charge);
  if (!paymentIntentId) {
    console.warn("[Stripe] charge.refunded sem payment_intent");
    return;
  }

  const order = await resolveOrderFromStripePaymentIntentId(paymentIntentId);
  if (!order) {
    console.warn(
      `[Stripe] Pedido não encontrado para reembolso (PI ${paymentIntentId})`,
    );
    return;
  }

  if (order.status === "REFUNDED") {
    return;
  }

  const amountRefunded = charge.amount_refunded ?? 0;
  const chargeAmount = charge.amount ?? 0;
  const fullyRefunded =
    chargeAmount > 0 && amountRefunded >= chargeAmount;

  const paidLikeStatuses = new Set([
    "PAID",
    "CONFIRMED",
    "PARTIAL_REFUND",
  ]);

  if (!paidLikeStatuses.has(order.status)) {
    console.warn(
      `[Stripe] Reembolso ignorado: pedido ${order.id} em status ${order.status}`,
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (fullyRefunded) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
        },
      });

      await Promise.all(
        order.orderItems.map((item) =>
          tx.batchTicket.update({
            where: { id: item.batchTicketId },
            data: {
              soldQuantity: { decrement: item.quantity },
            },
          }),
        ),
      );
    } else {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PARTIAL_REFUND",
          refundedAt: new Date(),
        },
      });
    }
  });
};
