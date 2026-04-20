import { prisma } from "../../config/database";
import { reconcileReservedQuantitiesForBatchTickets } from "../reservaService";

/**
 * Checkout expirou ou pagamento assíncrono falhou: atualiza o pedido,
 * expira a reserva associada e recalcula `reservedQuantity`.
 */
export const releaseUnpaidOrderAfterCheckoutFailure = async (
  checkoutSessionId: string,
  reason: "EXPIRED" | "FAILED",
) => {
  const order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: checkoutSessionId },
    include: {
      orderItems: true,
      reservation: {
        include: { tickets: { select: { batchTicketId: true } } },
      },
    },
  });

  if (!order) {
    console.warn(
      `[Stripe] Pedido não encontrado para checkout session ${checkoutSessionId}`,
    );
    return;
  }

  if (order.status !== "PENDING" && order.status !== "PROCESSING") {
    return;
  }

  const cancelReason =
    reason === "EXPIRED"
      ? "Checkout expirado"
      : "Falha no pagamento (assíncrono)";

  // Coletar todos os batchTicketIds afetados (order items + reservation tickets)
  const batchTicketIds = new Set(
    order.orderItems.map((i) => i.batchTicketId),
  );

  if (order.reservation) {
    for (const t of order.reservation.tickets) {
      batchTicketIds.add(t.batchTicketId);
    }
  }

  await prisma.$transaction(async (tx) => {
    // Cancelar o pedido
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: reason === "EXPIRED" ? "EXPIRED" : "FAILED",
        cancelReason,
      },
    });

    // Expirar a reserva associada e remover os tickets reservados
    if (order.reservation && order.reservation.status === "ACTIVE") {
      await tx.reservationTicket.deleteMany({
        where: { reservationId: order.reservation.id },
      });

      await tx.reservation.update({
        where: { id: order.reservation.id },
        data: { status: "EXPIRED", expiresAt: new Date() },
      });
    }
  });

  // Recalcular reservedQuantity agora que a reserva foi expirada
  await reconcileReservedQuantitiesForBatchTickets(Array.from(batchTicketIds));
};
