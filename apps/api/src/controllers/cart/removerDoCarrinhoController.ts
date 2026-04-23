import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { NaoEncontradoException } from "../../exceptions";
import {
  RemoverDoCarrinhoRequestSchema,
  RemoverDoCarrinhoResponseSchema,
} from "../../schemas/cart/removerDoCarrinhoSchema";
import { cancelReservation } from "../../services/reservaService";

/**
 * DELETE /:tenantSlug/cart/remove
 */
const removerDoCarrinho: RequestHandler<
  any,
  RemoverDoCarrinhoResponseSchema,
  RemoverDoCarrinhoRequestSchema
> = async (req, res) => {
  const { batchTicketId } = req.body;

  const batchTicket = await prisma.batchTicket.findUnique({
    where: { id: batchTicketId },
    include: { batch: { include: { event: true } } },
  });

  if (!batchTicket || batchTicket.batch.event.tenantId !== req.tenant!.id) {
    throw new NaoEncontradoException("Ingresso não encontrado neste evento.");
  }

  const cancelled = await cancelReservation(req.user!.id, req.tenant!.id, batchTicketId);

  return res.json({
    success: true,
    cancelled,
  });
};

export default removerDoCarrinho;
