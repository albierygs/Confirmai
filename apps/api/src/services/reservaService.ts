import {
  CHECKOUT_RESERVATION_EXTENSION_MS,
  RESERVATION_TTL_MS,
} from "../config/constants";
import { prisma } from "../config/database";
import { AppException, NaoEncontradoException } from "../exceptions";

const activeReservationWhere = {
  status: "ACTIVE" as const,
  expiresAt: { gte: new Date() },
};

/**
 * Soma quantidades reservadas (todas as reservas ativas) para um batch ticket.
 */
export const getAvailableQuantity = async (
  batchTicketId: string,
  excludeReservationTicketId?: string,
): Promise<number> => {
  await cleanExpiredReservations();

  const batchTicket = await prisma.batchTicket.findUnique({
    where: { id: batchTicketId },
  });

  if (!batchTicket) {
    throw new NaoEncontradoException("Ingresso não encontrado");
  }

  const activeReservations = await prisma.reservationTicket.aggregate({
    where: {
      batchTicketId,
      reservation: activeReservationWhere,
      ...(excludeReservationTicketId && {
        id: { not: excludeReservationTicketId },
      }),
    },
    _sum: {
      quantity: true,
    },
  });

  const reserved = activeReservations._sum.quantity || 0;
  const available = batchTicket.quantity - batchTicket.soldQuantity - reserved;

  return Math.max(0, available);
};

/**
 * Atualiza o contador denormalizado em BatchTicket a partir das reservas ativas.
 */
export const reconcileReservedQuantityForBatchTicket = async (
  batchTicketId: string,
) => {
  const activeReservations = await prisma.reservationTicket.aggregate({
    where: {
      batchTicketId,
      reservation: activeReservationWhere,
    },
    _sum: {
      quantity: true,
    },
  });

  await prisma.batchTicket.update({
    where: { id: batchTicketId },
    data: {
      reservedQuantity: activeReservations._sum.quantity || 0,
    },
  });
};

export const reconcileReservedQuantitiesForBatchTickets = async (
  batchTicketIds: string[],
) => {
  const unique = Array.from(new Set(batchTicketIds));
  await Promise.all(
    unique.map((id) => reconcileReservedQuantityForBatchTicket(id)),
  );
};

async function findActiveReservationWithTickets(
  userId: string,
  tenantId: string,
) {
  await cleanExpiredReservations();

  return prisma.reservation.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    include: { tickets: true },
  });
}

/**
 * Criar/atualizar linha do carrinho (uma reserva unificada por usuário e tenant).
 * O TTL de 30 min conta a partir da criação da reserva (1º ingresso), sem renovar ao adicionar outros.
 */
export const createOrUpdateReservation = async (
  userId: string,
  tenantId: string,
  batchTicketId: string,
  quantity: number,
) => {
  if (quantity < 0) {
    throw new AppException("Quantidade inválida.", 400, "InvalidQuantity");
  }

  let reservation = await findActiveReservationWithTickets(userId, tenantId);

  const existingLine = reservation?.tickets.find(
    (t) => t.batchTicketId === batchTicketId,
  );

  if (quantity === 0) {
    if (!reservation) {
      throw new AppException("Carrinho não encontrado.", 404, "CartNotFound");
    }
    if (existingLine) {
      await prisma.reservationTicket.delete({ where: { id: existingLine.id } });
      await reconcileReservedQuantityForBatchTicket(batchTicketId);
      const remaining = await prisma.reservationTicket.count({
        where: { reservationId: reservation.id },
      });
      if (remaining === 0) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { status: "CANCELLED" },
        });
      }
    }
    const updated = await prisma.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
      include: { tickets: true },
    });
    return { reservation: updated, line: null };
  }

  const available = await getAvailableQuantity(batchTicketId, existingLine?.id);

  if (available < quantity) {
    throw new AppException(
      `Apenas ${available} ingresso(s) disponível(is).`,
      400,
      "InsufficientQuantity",
    );
  }

  if (!reservation) {
    reservation = await prisma.reservation.create({
      data: {
        userId,
        tenantId,
        expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
        status: "ACTIVE",
      },
      include: { tickets: true },
    });
  }

  let line;
  if (existingLine) {
    line = await prisma.reservationTicket.update({
      where: { id: existingLine.id },
      data: { quantity },
    });
  } else {
    line = await prisma.reservationTicket.create({
      data: {
        reservationId: reservation.id,
        batchTicketId,
        quantity,
      },
    });
  }

  await reconcileReservedQuantityForBatchTicket(batchTicketId);

  const full = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservation.id },
    include: { tickets: true },
  });

  return { reservation: full, line };
};

/**
 * Alinha a reserva ativa com os itens do checkout e estende o prazo (+30 min).
 * Retorna `expiresAt` final da reserva (alinhado ao pedido).
 */
export const syncReservationForCheckout = async (
  userId: string,
  tenantId: string,
  items: Array<{ batchTicketId: string; quantity: number }>,
) => {
  await cleanExpiredReservations();

  let reservation = await prisma.reservation.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "asc" },
    include: { tickets: true },
  });

  if (!reservation) {
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
    reservation = await prisma.reservation.create({
      data: { userId, tenantId, expiresAt, status: "ACTIVE" },
      include: { tickets: true },
    });
  }

  const batchIds = new Set<string>();

  for (const t of reservation.tickets) {
    batchIds.add(t.batchTicketId);
  }

  let working = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservation.id },
    include: { tickets: true },
  });

  for (const item of items) {
    const existingLine = working.tickets.find(
      (t) => t.batchTicketId === item.batchTicketId,
    );
    const available = await getAvailableQuantity(
      item.batchTicketId,
      existingLine?.id,
    );
    if (available < item.quantity) {
      throw new AppException(
        `Apenas ${available} ingresso(s) disponível(is) para o ingresso selecionado.`,
        400,
        "InsufficientQuantity",
      );
    }
    batchIds.add(item.batchTicketId);
  }

  for (const item of items) {
    const existingLine = working.tickets.find(
      (t) => t.batchTicketId === item.batchTicketId,
    );
    if (existingLine) {
      await prisma.reservationTicket.update({
        where: { id: existingLine.id },
        data: { quantity: item.quantity },
      });
    } else {
      await prisma.reservationTicket.create({
        data: {
          reservationId: reservation.id,
          batchTicketId: item.batchTicketId,
          quantity: item.quantity,
        },
      });
    }
  }

  working = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservation.id },
    include: { tickets: true },
  });

  const base = new Date();
  const newExpiresAt = new Date(
    base.getTime() + CHECKOUT_RESERVATION_EXTENSION_MS,
  );

  const finalRes = await prisma.reservation.update({
    where: { id: reservation.id },
    data: { expiresAt: newExpiresAt },
    include: { tickets: true },
  });

  await reconcileReservedQuantitiesForBatchTickets(Array.from(batchIds));

  return { reservation: finalRes, expiresAt: newExpiresAt };
};

/**
 * Limpar reservas expiradas
 */
export const cleanExpiredReservations = async () => {
  const toExpire = await prisma.reservation.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    include: { tickets: { select: { batchTicketId: true } } },
  });

  if (toExpire.length === 0) {
    return 0;
  }

  const batchIds = Array.from(
    new Set(toExpire.flatMap((r) => r.tickets.map((t) => t.batchTicketId))),
  );
  const ids = toExpire.map((r) => r.id);

  await prisma.reservation.updateMany({
    where: { id: { in: ids } },
    data: { status: "EXPIRED" },
  });

  await reconcileReservedQuantitiesForBatchTickets(batchIds);

  console.log(`🧹 ${ids.length} reserva(s) expirada(s) marcada(s)`);

  return ids.length;
};

/**
 * Cancelar linha do carrinho (remover tipo de ingresso)
 */
export const cancelReservation = async (
  userId: string,
  tenantId: string,
  batchTicketId: string,
) => {
  const reservation = await prisma.reservation.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
    },
    include: { tickets: true },
  });

  if (!reservation) {
    throw new NaoEncontradoException("Carrinho não encontrado");
  }

  const line = reservation.tickets.find(
    (t) => t.batchTicketId === batchTicketId,
  );
  if (!line) {
    throw new NaoEncontradoException("Ingresso não encontrado no carrinho");
  }

  await prisma.reservationTicket.delete({ where: { id: line.id } });
  await reconcileReservedQuantityForBatchTicket(batchTicketId);

  const remaining = await prisma.reservationTicket.count({
    where: { reservationId: reservation.id },
  });
  if (remaining === 0) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "CANCELLED" },
    });
  }

  return true;
};

/**
 * Cancelar todas as reservas ativas do usuário para um tenant específico
 */
export const cancelAllReservations = async (
  userId: string,
  tenantId: string,
) => {
  const reservations = await prisma.reservation.findMany({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
    },
    include: { tickets: { select: { batchTicketId: true } } },
  });

  if (reservations.length === 0) {
    return 0;
  }

  const batchIds = Array.from(
    new Set(reservations.flatMap((r) => r.tickets.map((t) => t.batchTicketId))),
  );

  await prisma.reservationTicket.deleteMany({
    where: { reservationId: { in: reservations.map((r) => r.id) } },
  });

  await prisma.reservation.updateMany({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
    },
    data: {
      status: "CANCELLED",
    },
  });

  await reconcileReservedQuantitiesForBatchTickets(batchIds);

  return reservations.length;
};

/**
 * Consome do carrinho apenas os itens efetivamente comprados.
 */
export const convertReservationsToSale = async (
  reservationId: string,
  purchasedBatchTicketIds: string[],
) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId },
    include: { tickets: true },
    orderBy: { createdAt: "asc" },
  });

  if (!reservation) {
    return;
  }

  const purchasedIds = new Set(purchasedBatchTicketIds);
  const ticketsToDelete = reservation.tickets.filter((ticket) =>
    purchasedIds.has(ticket.batchTicketId),
  );

  if (ticketsToDelete.length === 0) {
    return;
  }

  await prisma.reservationTicket.deleteMany({
    where: {
      id: {
        in: ticketsToDelete.map((ticket) => ticket.id),
      },
    },
  });

  const remainingItems = await prisma.reservationTicket.count({
    where: {
      reservationId: reservation.id,
    },
  });

  if (remainingItems === 0) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "CONVERTED" },
    });
  }

  await reconcileReservedQuantitiesForBatchTickets(
    ticketsToDelete.map((ticket) => ticket.batchTicketId),
  );
};

/**
 * Buscar carrinho (reserva ativa + linhas) para um tenant específico
 */
export const getReservationsByUser = async (
  userId: string,
  tenantId: string,
) => {
  await cleanExpiredReservations();

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

  if (!reservation) {
    return [];
  }

  return reservation.tickets.map((t) => ({
    reservationId: reservation.id,
    reservationExpiresAt: reservation.expiresAt,
    batchTicketId: t.batchTicketId,
    quantity: t.quantity,
    batchTicket: t.batchTicket,
  }));
};
