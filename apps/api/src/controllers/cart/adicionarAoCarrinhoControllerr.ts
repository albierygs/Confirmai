import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { NaoEncontradoException } from "../../exceptions";
import {
  AdicionarAoCarrinhoRequestSchema,
  AdicionarAoCarrinhoResponseSchema,
} from "../../schemas/cart/adicionarAoCarrinhoSchema";
import { createOrUpdateReservation } from "../../services/reservaService";

/**
 * POST /:tenantSlug/cart/items — define a quantidade da linha (ingresso) no carrinho
 */
const adicionarAoCarrinho: RequestHandler<
  any,
  AdicionarAoCarrinhoResponseSchema,
  AdicionarAoCarrinhoRequestSchema
> = async (req, res) => {
  const { batchTicketId, quantity } = req.body;

  const batchTicket = await prisma.batchTicket.findUnique({
    where: { id: batchTicketId },
    include: { batch: { include: { event: true } } },
  });

  if (!batchTicket || batchTicket.batch.event.tenantId !== req.tenant!.id) {
    throw new NaoEncontradoException("Ingresso não encontrado neste evento.");
  }

  // Criar/atualizar reserva
  const { reservation, line } = await createOrUpdateReservation(
    req.user!.id,
    req.tenant!.id,
    batchTicketId,
    quantity,
  );

  return res.status(200).json({
    success: true,
    reservation: {
      id: reservation.id,
      quantity: line?.quantity ?? 0,
      expiresAt: reservation.expiresAt,
    },
  });
};

export default adicionarAoCarrinho;
