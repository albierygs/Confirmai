import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { ListUserOrdersResponseSchema } from "../../schemas/payment/listUserOrdersSchema";

/**
 * GET /:tenantSlug/orders — Lista todos os pedidos do usuário no tenant
 */
const listUserOrders: RequestHandler<
  any,
  ListUserOrdersResponseSchema
> = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 15, 50);
  const skip = (page - 1) * limit;

  const where = {
    userId: req.user!.id,
    tenantId: req.tenant!.id,
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      subtotal: order.subtotal.toNumber(),
      platformFee: order.platformFee.toNumber(),
      total: order.total.toNumber(),
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      items: order.orderItems.map((item) => ({
        eventName: item.batchTicket.batch.event.titulo,
        batchName: item.batchTicket.batch.name,
        ticketType: item.batchTicket.ticketType.name,
        quantity: item.quantity,
        price: item.price.toNumber(),
        total: item.total.toNumber(),
      })),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export default listUserOrders;
