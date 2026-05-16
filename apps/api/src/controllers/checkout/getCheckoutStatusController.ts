import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { NaoEncontradoException } from "../../exceptions";
import {
  GetCheckoutStatusParamsSchema,
  GetCheckoutStatusResponseSchema,
} from "../../schemas/payment/getCheckoutStatusSchema";

const getCheckoutStatus: RequestHandler<
  GetCheckoutStatusParamsSchema,
  GetCheckoutStatusResponseSchema
> = async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: req.user!.id, tenantId: req.tenant!.id },
    include: {
      orderItems: {
        include: {
          batchTicket: {
            include: {
              batch: {
                include: {
                  event: true,
                },
              },
              ticketType: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NaoEncontradoException("Pedido não encontrado.");
  }

  const events = Array.from(
    new Map(
      order.orderItems.map((item) => [
        item.batchTicket.batch.event.id,
        item.batchTicket.batch.event,
      ]),
    ).values(),
  );

  return res.json({
    id: order.id,
    status: order.status,
    events,
    items: order.orderItems.map((item) => ({
      eventName: item.batchTicket.batch.event.titulo,
      batchName: item.batchTicket.batch.name,
      ticketType: item.batchTicket.ticketType.name,
      quantity: item.quantity,
      price: item.price.toNumber(),
      total: item.total.toNumber(),
    })),
    subtotal: order.subtotal.toNumber(),
    platformFee: order.platformFee.toNumber(),
    total: order.total.toNumber(),
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  });
};

export default getCheckoutStatus;
