import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { NaoEncontradoException } from "../../exceptions";
import {
  BuscarDisponibilidadeParamsSchema,
  BuscarDisponibilidadeResponseSchema,
} from "../../schemas/cart/buscarDisponibilidadeSchema";
import { getAvailableQuantity } from "../../services/reservaService";

// ATRUBUIR AO ROUTES

/**
 * GET /:tenantSlug/tickets/:batchTicketId/availability
 */
const buscarDisponibilidade: RequestHandler<
  BuscarDisponibilidadeParamsSchema,
  BuscarDisponibilidadeResponseSchema
> = async (req, res) => {
  const { batchTicketId } = req.params;

  const batchTicket = await prisma.batchTicket.findUnique({
    where: { id: batchTicketId },
    include: { batch: { include: { event: true } } },
  });

  if (!batchTicket || batchTicket.batch.event.tenantId !== req.tenant!.id) {
    throw new NaoEncontradoException("Ingresso não encontrado neste evento.");
  }

  const available = await getAvailableQuantity(batchTicketId);

  return res.json({
    available,
  });
};

export default buscarDisponibilidade;
