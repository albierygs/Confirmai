import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { AppException, NaoEncontradoException } from "../../exceptions";
import { CheckinTicketResponseSchema } from "../../schemas/tickets/checkinTicketSchema";

/**
 * POST /:tenantSlug/tickets/checkin/:hash — Realiza o check-in de um ticket
 */
const checkinTicket: RequestHandler<
  { hash: string },
  CheckinTicketResponseSchema
> = async (req, res) => {
  const { hash } = req.params;

  const ticket = await prisma.ticket.findUnique({
    where: { hash },
    include: {
      event: true,
      usuario: true,
      batchTicket: {
        include: {
          batch: true,
          ticketType: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new NaoEncontradoException("Ticket não encontrado.");
  }

  // Verificar se o ticket pertence ao tenant
  if (ticket.event.tenantId !== req.tenant!.id) {
    throw new NaoEncontradoException("Ticket não encontrado neste evento.");
  }

  // Verificar status do ticket
  if (ticket.status === "USED") {
    throw new AppException(
      `Check-in já realizado em ${ticket.checkedInAt?.toLocaleString("pt-BR")}.`,
      400,
      "TICKET_ALREADY_CHECKED_IN",
    );
  }

  if (ticket.status === "CANCELED") {
    throw new AppException(
      "Este ticket foi cancelado.",
      400,
      "TICKET_CANCELED",
    );
  }

  if (ticket.status === "REFUNDED") {
    throw new AppException(
      "Este ticket foi reembolsado.",
      400,
      "TICKET_REFUNDED",
    );
  }

  // Verificar se está dentro do período do evento
  const now = new Date();
  const eventStart = new Date(ticket.event.startDate);
  const eventEnd = new Date(ticket.event.closingDate);

  if (now < eventStart) {
    throw new AppException(
      `O evento ainda não começou. Início: ${eventStart.toLocaleString("pt-BR")}.`,
      400,
      "EVENT_NOT_STARTED",
    );
  }

  if (now > eventEnd) {
    throw new AppException(
      `O evento já encerrou em ${eventEnd.toLocaleString("pt-BR")}.`,
      400,
      "EVENT_ENDED",
    );
  }

  // Realizar o check-in
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "USED",
      checkedInAt: now,
      checkedInBy: req.user!.id,
    },
  });

  return res.json({
    success: true,
    ticket: {
      id: updatedTicket.id,
      hash: updatedTicket.hash,
      status: updatedTicket.status,
      eventName: ticket.event.titulo,
      ticketType: ticket.batchTicket.ticketType.name,
      batchName: ticket.batchTicket.batch.name,
      ownerName: ticket.usuario.nome,
      checkedInAt: updatedTicket.checkedInAt!,
    },
  });
};

export default checkinTicket;
