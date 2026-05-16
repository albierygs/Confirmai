import Decimal from "decimal.js";
import Stripe from "stripe";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import { createOrderTickets } from "../ingressoService";
import { convertReservationsToSale } from "../reservaService";

const mapStripePaymentMethodTypeToEnum = (
  stripeType: string | undefined,
): ("CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BOLETO" | "WALLET") | null => {
  switch (stripeType) {
    case "card":
      return "CREDIT_CARD";
    case "pix":
      return "PIX";
    case "boleto":
      return "BOLETO";
    default:
      return null;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca o balance_transaction do checkout session com retry.
 * O balance_transaction pode não estar disponível imediatamente após o pagamento.
 */
const retrieveBalanceTransaction = async (
  checkoutSessionId: string,
  maxRetries = 5,
  delayMs = 3000,
): Promise<Stripe.BalanceTransaction | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
      expand: ["payment_intent.latest_charge.balance_transaction"],
    });

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
    const latestCharge = paymentIntent?.latest_charge as Stripe.Charge | null;
    const balanceTransaction =
      latestCharge?.balance_transaction as Stripe.BalanceTransaction | null;

    if (balanceTransaction && typeof balanceTransaction.fee === "number") {
      console.log(
        `✅ balance_transaction obtido na tentativa ${attempt}/${maxRetries}`,
      );
      return balanceTransaction;
    }

    console.log(
      `⏳ balance_transaction indisponível (tentativa ${attempt}/${maxRetries}), aguardando ${delayMs}ms...`,
    );

    if (attempt < maxRetries) {
      await sleep(delayMs);
    }
  }

  console.warn(
    `⚠️ balance_transaction não disponível após ${maxRetries} tentativas para session ${checkoutSessionId}`,
  );
  return null;
};

/**
 * Atualiza as taxas do Stripe (stripeFee e platformFee) no pedido.
 * Executado de forma assíncrona após a confirmação do pagamento.
 */
const updateStripeFees = async (checkoutSessionId: string, orderId: string) => {
  try {
    const balanceTransaction =
      await retrieveBalanceTransaction(checkoutSessionId);

    if (!balanceTransaction) {
      console.warn(
        `⚠️ Não foi possível obter as taxas do Stripe para o pedido ${orderId}. Será necessário atualizar manualmente.`,
      );
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { platformFee: true },
    });

    if (!order) return;

    const stripeFee = new Decimal(balanceTransaction.fee).div(100);
    const platformFee = order.platformFee.minus(stripeFee);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeApplicationFee: stripeFee,
        platformFee,
      },
    });

    console.log(
      `✅ Taxas do Stripe atualizadas para o pedido ${orderId}: stripeFee=${stripeFee}, platformFee=${platformFee}`,
    );
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar taxas do Stripe para o pedido ${orderId}:`,
      error,
    );
  }
};

export const confirmPayment = async (checkoutSessionId: string) => {
  const checkoutSession = await stripe.checkout.sessions.retrieve(
    checkoutSessionId,
    {
      expand: ["payment_intent"],
    },
  );

  if (checkoutSession.status !== "complete") {
    return null;
  }

  const orderId = checkoutSession.metadata!.orderId;

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  // Se não existe ou já foi pago, aborta para não mexer no estoque de novo
  if (!existingOrder || existingOrder.status === "PAID") {
    return null;
  }

  const paymentIntent =
    checkoutSession.payment_intent as Stripe.PaymentIntent | null;

  const transferDestination = paymentIntent?.transfer_data?.destination as
    | string
    | undefined;

  const paymentMethodType =
    checkoutSession.payment_method_types?.[0] ??
    (paymentIntent?.payment_method_types?.[0] as string | undefined);
  const paymentMethodEnum = mapStripePaymentMethodTypeToEnum(paymentMethodType);

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripeTransferId: transferDestination,
      ...(paymentMethodEnum ? { paymentMethod: paymentMethodEnum as any } : {}),
    },
    include: {
      orderItems: true,
    },
  });

  await convertReservationsToSale(
    order.reservationId,
    order.orderItems.map((item) => item.batchTicketId),
  );

  await Promise.all(
    order.orderItems.map((item) =>
      prisma.batchTicket.update({
        where: { id: item.batchTicketId },
        data: {
          soldQuantity: {
            increment: item.quantity,
          },
        },
      }),
    ),
  );

  await createOrderTickets(orderId);

  // Atualizar taxas do Stripe de forma assíncrona (não bloqueia a resposta do webhook)
  updateStripeFees(checkoutSessionId, orderId);

  return order;
};
