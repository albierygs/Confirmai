import { prisma } from "../config/database";
import { AppException, NaoEncontradoException } from "../exceptions";

/** Grace period em dias após expiração */
export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 3;

/**
 * Busca a assinatura ativa (ACTIVE ou PAST_DUE dentro do grace period) de um tenant.
 */
export const buscarAssinaturaAtiva = async (tenantId: string) => {
  const now = new Date();
  const gracePeriodLimit = new Date(now);
  gracePeriodLimit.setDate(
    gracePeriodLimit.getDate() - SUBSCRIPTION_GRACE_PERIOD_DAYS,
  );

  const subscription = await prisma.subscription.findFirst({
    where: {
      tenantId,
      OR: [
        {
          status: "ACTIVE",
          endDate: { gte: now },
        },
        {
          // Grace period: expirou há menos de 3 dias
          status: "PAST_DUE",
          endDate: { gte: gracePeriodLimit },
        },
      ],
    },
    include: { plan: true },
    orderBy: { endDate: "desc" },
  });

  return subscription;
};

/**
 * Cria uma assinatura para o tenant.
 * Verifica se já não existe assinatura ativa.
 */
export const criarAssinatura = async (
  tenantId: string,
  planId: string,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string,
) => {
  // Verificar se o plano existe e está ativo
  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  if (!plan) {
    throw new NaoEncontradoException("Plano não encontrado");
  }

  if (!plan.isActive) {
    throw new AppException("Plano não está disponível", 400, "Bad Request");
  }

  // Se vindo de Stripe, stripeSubscriptionId é obrigatório
  if (!stripeSubscriptionId) {
    console.warn(
      `⚠️ Assinatura criada sem stripeSubscriptionId para tenant ${tenantId}. Verificar fluxo de Stripe.`,
    );
  }

  // Verificar se já existe assinatura ativa
  const existingSubscription = await buscarAssinaturaAtiva(tenantId);

  if (existingSubscription) {
    throw new AppException(
      "Tenant já possui uma assinatura ativa",
      409,
      "Conflict",
    );
  }

  // Calcular datas
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (plan.interval === "MONTHLY") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const subscription = await prisma.subscription.create({
    data: {
      tenantId,
      planId,
      status: "ACTIVE",
      startDate,
      endDate,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
      stripeCustomerId: stripeCustomerId ?? null,
    },
    include: { plan: true },
  });

  return subscription;
};

/**
 * Cancela a assinatura ao final do período.
 */
export const cancelarAssinatura = async (tenantId: string) => {
  const subscription = await buscarAssinaturaAtiva(tenantId);

  if (!subscription) {
    throw new NaoEncontradoException("Nenhuma assinatura ativa encontrada");
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      cancelAtEnd: true,
      // Mantém status ACTIVE — o acesso continua até endDate
      // O cron job cuidará de mudar para CANCELED quando endDate passar
      canceledAt: new Date(),
    },
    include: { plan: true },
  });

  return updated;
};

/**
 * Job: expira assinaturas vencidas e cancela as marcadas.
 * Chamado pelo cron job diariamente.
 */
export const expirarAssinaturas = async () => {
  const now = new Date();
  const gracePeriodLimit = new Date(now);
  gracePeriodLimit.setDate(
    gracePeriodLimit.getDate() - SUBSCRIPTION_GRACE_PERIOD_DAYS,
  );

  // 1. Marcar como PAST_DUE assinaturas ativas expiradas (dentro do grace period)
  const pastDue = await prisma.subscription.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
    },
    data: { status: "PAST_DUE" },
  });

  // 2. Marcar como EXPIRED assinaturas PAST_DUE que passaram do grace period
  const expired = await prisma.subscription.updateMany({
    where: {
      status: "PAST_DUE",
      endDate: { lt: gracePeriodLimit },
    },
    data: { status: "EXPIRED" },
  });

  // 3. Marcar como CANCELED assinaturas com cancelAtEnd e que chegaram ao fim do período
  const canceled = await prisma.subscription.updateMany({
    where: {
      cancelAtEnd: true,
      status: { in: ["ACTIVE", "PAST_DUE"] },
      endDate: { lte: now },
    },
    data: { status: "CANCELED" },
  });

  return {
    pastDue: pastDue.count,
    expired: expired.count,
    canceled: canceled.count,
  };
};
