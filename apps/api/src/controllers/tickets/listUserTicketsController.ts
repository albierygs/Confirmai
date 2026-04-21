import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { ListUserTicketsResponseSchema } from "../../schemas/tickets/listUserTicketsSchema";

/**
 * GET /:tenantSlug/tickets — Lista todos os tickets gerados para o usuário no tenant
 */
const listUserTickets: RequestHandler<
  any,
  ListUserTicketsResponseSchema
> = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 15, 50);
  const skip = (page - 1) * limit;

  const where = {
    userId: req.user!.id,
    event: {
      tenantId: req.tenant!.id,
    },
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: true,
        batchTicket: {
          include: {
            batch: true,
            ticketType: true,
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return res.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      hash: ticket.hash,
      status: ticket.status,
      price: ticket.price.toNumber(),
      eventName: ticket.event.titulo,
      eventDate: ticket.event.startDate,
      batchName: ticket.batchTicket.batch.name,
      ticketType: ticket.batchTicket.ticketType.name,
      checkedInAt: ticket.checkedInAt,
      createdAt: ticket.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export default listUserTickets;
