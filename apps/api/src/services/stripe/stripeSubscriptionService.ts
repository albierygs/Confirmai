import { FRONTEND_URL } from "../../config/constants";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import { AppException, NaoEncontradoException } from "../../exceptions";
import { buscarAssinaturaAtiva } from "../assinaturaService";

/**
 * Cria um Stripe Customer para o tenant (se ainda não existir) e
 * cria um Stripe Checkout Session para assinatura.
 */
export const criarStripeSubscriptionCheckout = async (
  tenantId: string,
  planId: string,
) => {
  // Verificar se já existe assinatura ativa — impedir dupla contratação
  const existingActive = await buscarAssinaturaAtiva(tenantId);

  if (existingActive) {
    throw new AppException(
      "Tenant já possui uma assinatura ativa",
      409,
      "Conflict",
    );
  }

  // Buscar o plano com Stripe Price ID
  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  if (!plan) {
    throw new NaoEncontradoException("Plano não encontrado");
  }

  if (!plan.stripePriceId) {
    throw new AppException(
      "Plano não configurado no Stripe",
      500,
      "Internal Server Error",
    );
  }

  // Buscar tenant
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new NaoEncontradoException("Tenant não encontrado");
  }

  // Verificar se já existe um Stripe Customer para este tenant
  let stripeCustomerId: string | undefined;

  const existingSubscription = await prisma.subscription.findFirst({
    where: { tenantId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  if (existingSubscription?.stripeCustomerId) {
    stripeCustomerId = existingSubscription.stripeCustomerId;
  } else {
    // Criar novo customer no Stripe
    const customer = await stripe.customers.create({
      email: tenant.email,
      name: tenant.nome,
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    });
    stripeCustomerId = customer.id;
  }

  // Criar Checkout Session para subscription
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      tenantId,
      planId,
      type: "subscription",
    },
    success_url: `${FRONTEND_URL}/dashboard/assinatura?status=sucesso`,
    cancel_url: `${FRONTEND_URL}/dashboard/assinatura?status=cancelado`,
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    stripeCustomerId,
  };
};

/**
 * Cancela a assinatura no Stripe (ao final do período).
 */
export const cancelarStripeSubscription = async (
  stripeSubscriptionId: string,
) => {
  const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return updated;
};

/**
 * Reativa uma assinatura cancelada no Stripe (antes do final do período).
 */
export const reativarStripeSubscription = async (
  stripeSubscriptionId: string,
) => {
  const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  return updated;
};
