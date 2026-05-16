import crypto from "crypto";
import { ulid } from "ulid";
import { TICKET_PREFIX, TICKET_SECRET_KEY } from "../config/constants";
import { prisma } from "../config/database";
import { AppException, NaoEncontradoException } from "../exceptions";

export const verificarTipoIngressoExistente = async (tipoId: string) => {
  const tipoExistente = await prisma.ticketType.findUnique({
    where: { id: tipoId },
  });

  if (!tipoExistente) {
    throw new NaoEncontradoException("Tipo de ingresso não encontrado.");
  }

  return tipoExistente;
};

export const verificarTipoIngressoExistenteNoLote = async (
  tipoId: string,
  loteId: string,
) => {
  const tipoExistente = await prisma.batchTicket.findUnique({
    where: { batchId_ticketTypeId: { batchId: loteId, ticketTypeId: tipoId } },
  });

  if (tipoExistente) {
    throw new AppException(
      "Este tipo de ingresso já foi adicionado a este lote.",
      400,
      "Bad Request",
    );
  }
};

export const createOrderTickets = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      orderItems: {
        include: {
          batchTicket: {
            include: {
              batch: true,
            },
          },
        },
      },
      usuario: true,
    },
  });

  if (!order) {
    throw new NaoEncontradoException("Pedido não encontrado.");
  }

  for (const item of order.orderItems) {
    const eventId = item.batchTicket.batch.eventId;

    for (let i = 1; i <= item.quantity; i++) {
      const ticket = await prisma.ticket.create({
        data: {
          orderId,
          batchTicketId: item.batchTicketId,
          eventId,
          userId: order.usuario.id,
          price: item.price,
          hash: generateQrcodeHash(
            eventId,
            order.usuario.id,
            item.batchTicketId,
            orderId,
            i,
          ),
        },
      });

      console.info("Ticket criado:", ticket.id);
    }
  }
};

export const generateQrcodeHash = (
  eventId: string,
  userId: string,
  batchTicketId: string,
  orderId: string,
  itemIndex: number,
): string => {
  const ulidPart = ulid();

  const payload = `${userId}:${eventId}:${orderId}:${itemIndex}:${batchTicketId}:${ulidPart}:${Date.now()}`;

  const hmac = crypto
    .createHmac("sha256", TICKET_SECRET_KEY)
    .update(payload)
    .digest("hex");

  const hmacTruncated = hmac.substring(0, 8);

  const hash = `${TICKET_PREFIX}_${ulidPart}_${hmacTruncated}`;

  return hash;
};
