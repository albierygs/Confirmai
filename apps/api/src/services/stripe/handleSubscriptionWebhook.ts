import Stripe from "stripe";
import { prisma } from "../../config/database";
import { criarAssinatura } from "../assinaturaService";

/**
 * Extrai o subscription ID de uma Invoice (compatível com Stripe SDK v20+).
 * Na v20+, Invoice.subscription foi removido. O ID vem dos line items.
 */
const getSubscriptionIdFromInvoice = (
  invoice: Stripe.Invoice,
): string | undefined => {
  const lineItem = invoice.lines?.data?.[0];
  if (!lineItem?.subscription) {
    return undefined;
  }
  return typeof lineItem.subscription === "string"
    ? lineItem.subscription
    : lineItem.subscription.id;
};

/**
 * Processa o evento de checkout.session.completed para assinaturas.
 * Chamado quando o pagamento da assinatura é confirmado pelo Stripe.
 */
export const processSubscriptionCheckoutCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { tenantId, planId, type } = session.metadata || {};

  // Só processar checkouts de assinatura
  if (type !== "subscription") return;

  if (!tenantId || !planId) {
    console.error("❌ Subscription checkout sem metadata tenantId/planId");
    return;
  }

  if (!session.subscription) {
    console.error(
      `❌ Checkout ${session.id} não contém subscription ID. Verifique webhooks do Stripe.`,
    );
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  console.log(
    `🔍 Processando subscription ${stripeSubscriptionId} para tenant ${tenantId}`,
  );

  // Verificar se já existe assinatura com este stripeSubscriptionId
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (existing) {
    console.log(`ℹ️ Assinatura ${stripeSubscriptionId} já processada no banco`);
    return;
  }

  // Criar assinatura no banco
  const subscription = await criarAssinatura(
    tenantId,
    planId,
    stripeSubscriptionId,
    stripeCustomerId ?? undefined,
  );

  console.log(
    `✅ Assinatura criada: ${subscription.id} | Stripe ID: ${subscription.stripeSubscriptionId} | Tenant: ${tenantId}`,
  );
};

/**
 * Processa a renovação automática da assinatura (invoice.paid).
 * Atualiza a endDate da assinatura para o próximo período.
 *
 * IMPORTANTE: Ignora invoices de criação (billing_reason === "subscription_create")
 * pois a assinatura já é criada no processSubscriptionCheckoutCompleted.
 * Processa apenas renovações (billing_reason === "subscription_cycle").
 */
export const processInvoicePaid = async (invoice: Stripe.Invoice) => {
  // Ignorar invoices de criação — a assinatura já foi criada via checkout
  if (invoice.billing_reason === "subscription_create") {
    console.log(
      `ℹ️ Invoice ${invoice.id} é de criação (subscription_create), ignorando`,
    );
    return;
  }

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    console.log(
      `⚠️ Invoice ${invoice.id} não contém subscription, ignorando evento`,
    );
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    console.log(
      `⚠️ Subscription ${subscriptionId} não encontrada no banco de dados. Ignorando renovação.`,
    );
    return;
  }

  // Usar o period_end da invoice como fonte de verdade para a nova data
  const lineItem = invoice.lines?.data?.[0];
  const periodEnd = lineItem?.period?.end;

  if (!periodEnd) {
    console.error(
      `❌ Invoice ${invoice.id} não possui period.end nos line items`,
    );
    return;
  }

  const newEndDate = new Date(periodEnd * 1000);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      endDate: newEndDate,
      cancelAtEnd: false,
      canceledAt: null,
    },
  });

  console.log(
    `✅ Assinatura ${subscription.id} renovada até ${newEndDate.toISOString()} | Invoice: ${invoice.id}`,
  );
};

/**
 * Processa falha no pagamento da invoice (invoice.payment_failed).
 * Marca a assinatura como PAST_DUE.
 */
export const processInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    console.log(
      `⚠️ Invoice ${invoice.id} não contém subscription, ignorando evento`,
    );
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.log(
      `⚠️ Subscription ${subscriptionId} não encontrada no banco de dados`,
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });

  console.log(
    `⚠️ Assinatura ${subscription.id} marcada como PAST_DUE (pagamento falhou)`,
  );
};

/**
 * Processa a atualização de status da subscription no Stripe.
 * Sincroniza cancelamentos e mudanças de status.
 */
export const processSubscriptionUpdated = async (
  stripeSubscription: Stripe.Subscription,
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.log(
      `⚠️ Subscription ${stripeSubscription.id} não encontrada no banco de dados`,
    );
    return;
  }

  // Mapear status do Stripe para status local
  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "PAST_DUE",
  };

  const newStatus = statusMap[stripeSubscription.status];
  if (!newStatus) {
    console.log(
      `⚠️ Status não mapeado para Stripe status: ${stripeSubscription.status}`,
    );
    return;
  }

  // Sincronizar endDate com o Stripe (v20+: period está nos items)
  const periodEnd = stripeSubscription.items?.data?.[0]?.current_period_end;
  const endDate = periodEnd ? new Date(periodEnd * 1000) : undefined;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      cancelAtEnd: stripeSubscription.cancel_at_period_end ?? false,
      canceledAt: stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
      ...(endDate ? { endDate } : {}),
    },
  });

  console.log(`🔄 Assinatura ${subscription.id} atualizada: ${newStatus}`);
};

/**
 * Processa a exclusão/cancelamento definitivo da subscription no Stripe.
 */
export const processSubscriptionDeleted = async (
  stripeSubscription: Stripe.Subscription,
) => {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.log(
      `⚠️ Subscription ${stripeSubscription.id} não encontrada no banco de dados`,
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  console.log(`❌ Assinatura ${subscription.id} cancelada definitivamente`);
};
