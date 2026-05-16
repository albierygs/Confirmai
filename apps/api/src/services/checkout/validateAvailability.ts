import Decimal from "decimal.js";
import { prisma } from "../../config/database";
import {
  AppException,
  NaoAutorizadoException,
  NaoEncontradoException,
} from "../../exceptions";
import { getAvailableQuantity } from "../reservaService";

interface ValidatedItem {
  batchTicketId: string;
  quantity: number;
  price: number;
  ticketTypeName: string;
  batchName: string;
  eventId: string;
  eventName: string;
}

export const validateAvailability = async (
  userId: string,
  tenantId: string,
): Promise<{
  reservationId: string;
  validatedItems: ValidatedItem[];
  subtotal: Decimal;
}> => {
  const reservation = await prisma.reservation.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    include: {
      tickets: {
        where: {
          batchTicket: {
            batch: {
              event: {
                tenantId,
              },
            },
          },
        },
        include: {
          batchTicket: {
            include: {
              ticketType: true,
              batch: {
                include: {
                  event: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!reservation || reservation.tickets.length === 0) {
    throw new NaoEncontradoException(
      "Nenhum ingresso reservado foi encontrado para checkout.",
    );
  }

  let subtotal = new Decimal(0);
  const validatedItems: ValidatedItem[] = [];

  for (const reservationItem of reservation.tickets) {
    const { batchTicket } = reservationItem;

    if (batchTicket.batch.event.tenantId !== tenantId) {
      throw new NaoAutorizadoException(
        "Existem ingressos na reserva que não pertencem a este organizador.",
      );
    }

    if (!batchTicket.isActive) {
      throw new NaoEncontradoException(
        `Ingresso ${batchTicket.ticketType.name} não está disponível.`,
      );
    }

    const available = await getAvailableQuantity(
      reservationItem.batchTicketId,
      reservationItem.id,
    );

    if (available < reservationItem.quantity) {
      throw new AppException(
        `Apenas ${available} ingresso(s) disponível(is) para ${batchTicket.ticketType.name}.`,
        409,
        "Disponibilidade Insuficiente",
      );
    }

    const now = new Date();
    if (now < batchTicket.batch.startDate) {
      throw new NaoAutorizadoException(
        `Vendas para ${batchTicket.batch.name} ainda não começaram.`,
      );
    }
    if (now > batchTicket.batch.endDate) {
      throw new NaoAutorizadoException(
        `Vendas para ${batchTicket.batch.name} já encerraram.`,
      );
    }

    const itemPrice = batchTicket.price;
    const itemTotal = itemPrice.mul(reservationItem.quantity);
    subtotal = subtotal.plus(itemTotal);

    validatedItems.push({
      batchTicketId: reservationItem.batchTicketId,
      quantity: reservationItem.quantity,
      price: batchTicket.price.toNumber(),
      ticketTypeName: batchTicket.ticketType.name,
      batchName: batchTicket.batch.name,
      eventId: batchTicket.batch.eventId,
      eventName: batchTicket.batch.event.titulo,
    });
  }

  return {
    reservationId: reservation.id,
    validatedItems,
    subtotal,
  };
};
