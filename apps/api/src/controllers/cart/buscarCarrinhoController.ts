import Decimal from "decimal.js";
import { RequestHandler } from "express";
import { BuscarCarrinhoResponseSchema } from "../../schemas/cart/buscarCarrinhoSchema";
import { getReservationsByUser } from "../../services/reservaService";

/**
 * GET /:tenantSlug/cart
 */
const buscarCarrinho: RequestHandler<
  any,
  BuscarCarrinhoResponseSchema
> = async (req, res) => {
  const reservations = await getReservationsByUser(req.user!.id, req.tenant!.id);

  const items = reservations.map((r) => ({
    reservationId: r.reservationId,
    batchTicketId: r.batchTicketId,
    eventName: r.batchTicket.batch.event.titulo,
    batchName: r.batchTicket.batch.name,
    ticketType: r.batchTicket.ticketType.name,
    quantity: r.quantity,
    pricePerUnit: r.batchTicket.price.toDecimalPlaces(2).toNumber(),
    subtotal: r.batchTicket.price
      .mul(r.quantity)
      .toDecimalPlaces(2)
      .toNumber(),
    expiresAt: r.reservationExpiresAt,
  }));

  const total = items
    .reduce((sum, item) => sum.plus(item.subtotal), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();

  return res.json({
    items,
    total,
  });
};

export default buscarCarrinho;
