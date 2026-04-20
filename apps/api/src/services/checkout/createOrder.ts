import Decimal from "decimal.js";
import { prisma } from "../../config/database";
import { syncReservationForCheckout } from "../reservaService";

interface CreateOrderData {
  tenantId: string;
  reservationId: string;
  userId: string;
  validatedItems: Array<{
    batchTicketId: string;
    quantity: number;
    price: number;
    ticketTypeName: string;
    batchName: string;
    eventId: string;
    eventName: string;
  }>;
  subtotal: Decimal;
  platformFee: Decimal;
  paymentProvider: string;
}

export const createOrder = async (data: CreateOrderData) => {
  // Converter para centavos para armazenar no DB
  const subtotal = data.subtotal.toNumber();
  const platformFee = data.platformFee.toNumber();
  const total = subtotal; // Total = subtotal (sem taxa adicional)

  const { expiresAt } = await syncReservationForCheckout(
    data.userId,
    data.tenantId,
    data.validatedItems.map((i) => ({
      batchTicketId: i.batchTicketId,
      quantity: i.quantity,
    })),
  );

  const order = await prisma.order.create({
    data: {
      tenantId: data.tenantId,
      reservationId: data.reservationId,
      userId: data.userId,
      subtotal,
      serviceFee: 0, // Sem taxa de conveniência
      platformFee,
      total,
      status: "PENDING",
      paymentProvider: data.paymentProvider,
      paymentMethod: null,
      expiresAt,
      orderItems: {
        create: data.validatedItems.map((item) => ({
          batchTicketId: item.batchTicketId,
          ticketTypeName: item.ticketTypeName,
          batchName: item.batchName,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
      },
    },
    include: {
      orderItems: true,
    },
  });

  return order;
};
