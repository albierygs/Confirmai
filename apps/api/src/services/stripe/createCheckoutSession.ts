import Stripe from "stripe";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import { AppException, NaoEncontradoException } from "../../exceptions";

export const createCheckoutSession = async (
  orderId: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tenant: {
        include: {
          stripeAccount: true,
        },
      },
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
      usuario: true,
    },
  });

  if (!order) {
    throw new NaoEncontradoException("Pedido não encontrado.");
  }

  if (!order.tenant.stripeAccount) {
    throw new AppException(
      "Organizador não configurou forma de pagamento.",
      400,
      "StripeAccountNotConfigured",
    );
  }

  if (!order.tenant.stripeAccount.chargesEnabled) {
    throw new AppException(
      "Conta do organizador não está habilitada para receber pagamentos.",
      400,
      "StripeAccountNotEnabled",
    );
  }

  const platformFeeInCents = order.platformFee.mul(100).toNumber();
  const eventIds = Array.from(
    new Set(order.orderItems.map((item) => item.batchTicket.batch.event.id)),
  );
  const firstEventName = order.orderItems[0]?.batchTicket.batch.event.titulo;
  const statementDescriptor = ((firstEventName || order.tenant.nome || "CONFIRMAI")
    .substring(0, 22)
    .replace(/[^a-zA-Z0-9 ]/g, "")) || "CONFIRMAI";

  // Criar Checkout Session com split no payment_intent_data
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.usuario.email,
    client_reference_id: order.id,

    line_items: order.orderItems.map((item) => {
      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Ingressos ${item.batchTicket.batch.event.titulo} - ${item.batchTicket.batch.name} - ${item.batchTicket.ticketType.name}`,
          },
          unit_amount: item.price.mul(100).toNumber(),
        },
        quantity: item.quantity,
      };
      return lineItem;
    }),

    // O Split (Destination Charge) no Checkout precisa ficar aqui dentro
    payment_intent_data: {
      application_fee_amount: platformFeeInCents,
      transfer_data: {
        destination: order.tenant.stripeAccount.accountId,
      },
      statement_descriptor: statementDescriptor,
      metadata: {
        orderId: order.id,
        tenantId: order.tenantId,
        eventIds: eventIds.join(","),
      },
    },

    metadata: {
      orderId: order.id,
      tenantId: order.tenantId,
      eventIds: eventIds.join(","),
      itemCount: String(order.orderItems.length),
    },

    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  // Salvar no banco
  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeCheckoutSessionId: session.id,
      paymentUrl: session.url,
      status: "PROCESSING",
    },
  });

  return session;
};
