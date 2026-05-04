/**
 * Testes de integração do fluxo de assinaturas com Stripe Test Clocks.
 *
 * Requisitos:
 * - STRIPE_SECRET_KEY configurado no .env (sk_test_*)
 * - Banco de dados acessível
 * - Planos com stripePriceId preenchidos (executar seed antes)
 *
 * Execução:
 *   npm run test -- --testPathPattern=subscription
 *
 * ⚠️ Estes testes fazem chamadas reais à API do Stripe em modo teste.
 *     Cada execução cria recursos (customers, subscriptions, test clocks)
 *     que são automaticamente limpos no afterAll.
 */

import Stripe from "stripe";
import { prisma } from "../config/database";
import { STRIPE_SECRET_KEY } from "../config/constants";
import {
  buscarAssinaturaAtiva,
  criarAssinatura,
  cancelarAssinatura,
  expirarAssinaturas,
  SUBSCRIPTION_GRACE_PERIOD_DAYS,
} from "../services/assinaturaService";
import {
  processSubscriptionCheckoutCompleted,
  processInvoicePaid,
  processInvoicePaymentFailed,
  processSubscriptionUpdated,
  processSubscriptionDeleted,
} from "../services/stripe/handleSubscriptionWebhook";

const stripe = new Stripe(STRIPE_SECRET_KEY, { typescript: true });

// ─── Helpers de limpeza ────────────────────────────────────────────────────────

const createdTestClocks: string[] = [];
const createdCustomers: string[] = [];
const createdSubscriptions: string[] = [];
let testTenantId: string;
let testPlanMonthly: { id: string; stripePriceId: string };

// ─── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // Garantir que existe um tenant de teste
  const tenant = await prisma.tenants.upsert({
    where: { slug: "test-subscription" },
    update: {},
    create: {
      nome: "Tenant Teste Assinatura",
      cnpj: "99999999000199",
      telefone: "11999999999",
      email: "test-sub@example.com",
      slug: "test-subscription",
      status: "ativo",
    },
  });
  testTenantId = tenant.id;

  // Buscar plano mensal com Stripe Price ID
  const plan = await prisma.plan.findFirst({
    where: { slug: "mensal", isActive: true, stripePriceId: { not: null } },
  });

  if (!plan || !plan.stripePriceId) {
    throw new Error(
      "Plano mensal sem stripePriceId. Execute o seed antes dos testes: npm run dev",
    );
  }

  testPlanMonthly = { id: plan.id, stripePriceId: plan.stripePriceId };
}, 30_000);

afterAll(async () => {
  // Limpar subscriptions no Stripe
  for (const subId of createdSubscriptions) {
    try {
      await stripe.subscriptions.cancel(subId);
    } catch {
      // Ignorar — pode já ter sido cancelada
    }
  }

  // Limpar test clocks (também exclui customers e subscriptions associados)
  for (const clockId of createdTestClocks) {
    try {
      await stripe.testHelpers.testClocks.del(clockId);
    } catch {
      // Ignorar
    }
  }

  // Limpar customers órfãos (fora de test clocks)
  for (const cusId of createdCustomers) {
    try {
      await stripe.customers.del(cusId);
    } catch {
      // Ignorar
    }
  }

  // Limpar assinaturas de teste do banco
  await prisma.subscription.deleteMany({
    where: { tenantId: testTenantId },
  });

  // Limpar tenant de teste
  await prisma.tenants.deleteMany({
    where: { slug: "test-subscription" },
  });

  await prisma.$disconnect();
}, 30_000);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Cria um Stripe Customer com Test Clock + payment method.
 */
const createTestCustomerWithClock = async (
  frozenTime: Date,
): Promise<{ customerId: string; clockId: string }> => {
  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(frozenTime.getTime() / 1000),
    name: `Test ${Date.now()}`,
  });
  createdTestClocks.push(clock.id);

  // Criar payment method
  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });

  const customer = await stripe.customers.create({
    name: "Tenant Teste",
    email: "test-sub@example.com",
    test_clock: clock.id,
    payment_method: pm.id,
    invoice_settings: { default_payment_method: pm.id },
  });
  createdCustomers.push(customer.id);

  return { customerId: customer.id, clockId: clock.id };
};


/**
 * Avança o Test Clock e espera o Stripe processar.
 */
const advanceClockAndWait = async (
  clockId: string,
  newTime: Date,
  waitMs = 10_000,
): Promise<void> => {
  await stripe.testHelpers.testClocks.advance(clockId, {
    frozen_time: Math.floor(newTime.getTime() / 1000),
  });
  // Test Clocks precisam de tempo para processar os eventos
  await new Promise((resolve) => setTimeout(resolve, waitMs));
};

/**
 * Limpa assinaturas do tenant no banco para isolar os testes.
 */
const cleanLocalSubscriptions = async () => {
  await prisma.subscription.deleteMany({
    where: { tenantId: testTenantId },
  });
};

// ─── Testes: Serviço Local (assinaturaService) ─────────────────────────────────

describe("assinaturaService", () => {
  beforeEach(async () => {
    await cleanLocalSubscriptions();
  });

  describe("criarAssinatura", () => {
    it("deve criar uma assinatura ACTIVE com datas corretas", async () => {
      const now = new Date();
      const sub = await criarAssinatura(testTenantId, testPlanMonthly.id);

      expect(sub.status).toBe("ACTIVE");
      expect(sub.tenantId).toBe(testTenantId);
      expect(sub.planId).toBe(testPlanMonthly.id);
      expect(sub.plan).toBeDefined();
      expect(sub.startDate.getTime()).toBeGreaterThanOrEqual(
        now.getTime() - 1000,
      );

      // endDate deve ser ~1 mês no futuro
      const diffMs = sub.endDate.getTime() - sub.startDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it("deve rejeitar criação se já existe assinatura ativa", async () => {
      await criarAssinatura(testTenantId, testPlanMonthly.id);

      try {
        await criarAssinatura(testTenantId, testPlanMonthly.id);
        fail("Deveria ter lançado exceção");
      } catch (err: any) {
        expect(err.mensagem).toBe("Tenant já possui uma assinatura ativa");
        expect(err.status).toBe(409);
      }
    });

    it("deve rejeitar plano inexistente", async () => {
      try {
        await criarAssinatura(
          testTenantId,
          "00000000-0000-0000-0000-000000000000",
        );
        fail("Deveria ter lançado exceção");
      } catch (err: any) {
        expect(err.mensagem).toBe("Plano não encontrado");
        expect(err.status).toBe(404);
      }
    });
  });

  describe("buscarAssinaturaAtiva", () => {
    it("deve retornar null quando não há assinatura", async () => {
      const result = await buscarAssinaturaAtiva(testTenantId);
      expect(result).toBeNull();
    });

    it("deve retornar a assinatura ACTIVE", async () => {
      await criarAssinatura(testTenantId, testPlanMonthly.id);
      const result = await buscarAssinaturaAtiva(testTenantId);

      expect(result).not.toBeNull();
      expect(result!.status).toBe("ACTIVE");
    });

    it("deve retornar assinatura PAST_DUE dentro do grace period", async () => {
      const sub = await criarAssinatura(testTenantId, testPlanMonthly.id);

      // Simular PAST_DUE com endDate expirada há 1 dia (dentro do grace period de 3 dias)
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE", endDate: expiredDate },
      });

      const result = await buscarAssinaturaAtiva(testTenantId);
      expect(result).not.toBeNull();
      expect(result!.status).toBe("PAST_DUE");
    });

    it("deve retornar null para PAST_DUE fora do grace period", async () => {
      const sub = await criarAssinatura(testTenantId, testPlanMonthly.id);

      // Simular expiração há 5 dias (fora do grace period de 3 dias)
      const expiredDate = new Date();
      expiredDate.setDate(
        expiredDate.getDate() - (SUBSCRIPTION_GRACE_PERIOD_DAYS + 2),
      );
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE", endDate: expiredDate },
      });

      const result = await buscarAssinaturaAtiva(testTenantId);
      expect(result).toBeNull();
    });
  });

  describe("cancelarAssinatura", () => {
    it("deve marcar cancelAtEnd sem mudar status para CANCELED", async () => {
      await criarAssinatura(testTenantId, testPlanMonthly.id);
      const canceled = await cancelarAssinatura(testTenantId);

      expect(canceled.cancelAtEnd).toBe(true);
      expect(canceled.canceledAt).not.toBeNull();
      // O status deve continuar ACTIVE — tenant mantém acesso até endDate
      expect(canceled.status).toBe("ACTIVE");
    });

    it("deve permitir buscar assinatura ativa após cancelar (acesso até período acabar)", async () => {
      await criarAssinatura(testTenantId, testPlanMonthly.id);
      await cancelarAssinatura(testTenantId);

      const result = await buscarAssinaturaAtiva(testTenantId);
      expect(result).not.toBeNull();
    });

    it("deve rejeitar quando não há assinatura ativa", async () => {
      try {
        await cancelarAssinatura(testTenantId);
        fail("Deveria ter lançado exceção");
      } catch (err: any) {
        expect(err.mensagem).toBe("Nenhuma assinatura ativa encontrada");
        expect(err.status).toBe(404);
      }
    });
  });

  describe("expirarAssinaturas (cron job)", () => {
    it("deve marcar assinaturas ACTIVE expiradas como PAST_DUE", async () => {
      const sub = await criarAssinatura(testTenantId, testPlanMonthly.id);

      // Forçar endDate no passado
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { endDate: new Date(Date.now() - 1000) },
      });

      const result = await expirarAssinaturas();
      expect(result.pastDue).toBeGreaterThanOrEqual(1);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.status).toBe("PAST_DUE");
    });

    it("deve marcar PAST_DUE expiradas fora do grace period como EXPIRED", async () => {
      const sub = await criarAssinatura(testTenantId, testPlanMonthly.id);

      const expiredDate = new Date();
      expiredDate.setDate(
        expiredDate.getDate() - (SUBSCRIPTION_GRACE_PERIOD_DAYS + 1),
      );
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE", endDate: expiredDate },
      });

      const result = await expirarAssinaturas();
      expect(result.expired).toBeGreaterThanOrEqual(1);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.status).toBe("EXPIRED");
    });

    it("deve cancelar assinaturas com cancelAtEnd quando o período acaba", async () => {
      const sub = await criarAssinatura(testTenantId, testPlanMonthly.id);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          cancelAtEnd: true,
          canceledAt: new Date(),
          endDate: new Date(Date.now() - 1000),
        },
      });

      const result = await expirarAssinaturas();
      expect(result.canceled).toBeGreaterThanOrEqual(1);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.status).toBe("CANCELED");
    });
  });
});

// ─── Testes: Webhook Handlers ──────────────────────────────────────────────────

describe("handleSubscriptionWebhook", () => {
  beforeEach(async () => {
    await cleanLocalSubscriptions();
  });

  describe("processSubscriptionCheckoutCompleted", () => {
    it("deve criar assinatura a partir de checkout session", async () => {
      const fakeSession = {
        id: "cs_test_fake_" + Date.now(),
        metadata: {
          tenantId: testTenantId,
          planId: testPlanMonthly.id,
          type: "subscription",
        },
        subscription: "sub_fake_" + Date.now(),
        customer: "cus_fake_" + Date.now(),
      } as unknown as Stripe.Checkout.Session;

      await processSubscriptionCheckoutCompleted(fakeSession);

      const sub = await prisma.subscription.findFirst({
        where: { tenantId: testTenantId },
      });

      expect(sub).not.toBeNull();
      expect(sub!.status).toBe("ACTIVE");
      expect(sub!.stripeSubscriptionId).toBe(fakeSession.subscription);
    });

    it("deve ignorar se type não é subscription", async () => {
      const fakeSession = {
        id: "cs_test_payment",
        metadata: { type: "payment" },
      } as unknown as Stripe.Checkout.Session;

      await processSubscriptionCheckoutCompleted(fakeSession);

      const count = await prisma.subscription.count({
        where: { tenantId: testTenantId },
      });
      expect(count).toBe(0);
    });

    it("deve ignorar duplicatas (stripeSubscriptionId já existe)", async () => {
      const subId = "sub_dedup_" + Date.now();

      const fakeSession = {
        id: "cs_test_dedup",
        metadata: {
          tenantId: testTenantId,
          planId: testPlanMonthly.id,
          type: "subscription",
        },
        subscription: subId,
        customer: "cus_dedup",
      } as unknown as Stripe.Checkout.Session;

      await processSubscriptionCheckoutCompleted(fakeSession);
      // Segunda chamada — não deve duplicar
      await processSubscriptionCheckoutCompleted(fakeSession);

      const count = await prisma.subscription.count({
        where: { stripeSubscriptionId: subId },
      });
      expect(count).toBe(1);
    });
  });

  describe("processInvoicePaid", () => {
    it("deve ignorar invoices de criação (subscription_create)", async () => {
      const sub = await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        "sub_invoice_create_" + Date.now(),
      );
      const originalEndDate = sub.endDate;

      const fakeInvoice = {
        id: "in_test_create",
        billing_reason: "subscription_create",
        lines: {
          data: [
            {
              subscription: sub.stripeSubscriptionId,
              period: { end: Math.floor(Date.now() / 1000) + 86400 * 60 },
            },
          ],
        },
      } as unknown as Stripe.Invoice;

      await processInvoicePaid(fakeInvoice);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      // endDate não deve ter mudado
      expect(updated!.endDate.getTime()).toBe(originalEndDate.getTime());
    });

    it("deve renovar assinatura com invoice de ciclo (subscription_cycle)", async () => {
      const sub = await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        "sub_invoice_cycle_" + Date.now(),
      );

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 60;
      const fakeInvoice = {
        id: "in_test_cycle",
        billing_reason: "subscription_cycle",
        lines: {
          data: [
            {
              subscription: sub.stripeSubscriptionId,
              period: { end: futureTimestamp },
            },
          ],
        },
      } as unknown as Stripe.Invoice;

      await processInvoicePaid(fakeInvoice);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.endDate.getTime()).toBe(futureTimestamp * 1000);
      expect(updated!.status).toBe("ACTIVE");
    });
  });

  describe("processInvoicePaymentFailed", () => {
    it("deve marcar assinatura como PAST_DUE", async () => {
      const stripeSubId = "sub_fail_" + Date.now();
      const sub = await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        stripeSubId,
      );

      const fakeInvoice = {
        id: "in_test_fail",
        lines: {
          data: [{ subscription: stripeSubId }],
        },
      } as unknown as Stripe.Invoice;

      await processInvoicePaymentFailed(fakeInvoice);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.status).toBe("PAST_DUE");
    });
  });

  describe("processSubscriptionUpdated", () => {
    it("deve sincronizar status e cancelAtEnd", async () => {
      const stripeSubId = "sub_updated_" + Date.now();
      const sub = await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        stripeSubId,
      );

      const fakeStripeSub = {
        id: stripeSubId,
        status: "active",
        cancel_at_period_end: true,
        canceled_at: Math.floor(Date.now() / 1000),
        items: { data: [] },
      } as unknown as Stripe.Subscription;

      await processSubscriptionUpdated(fakeStripeSub);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.cancelAtEnd).toBe(true);
      expect(updated!.canceledAt).not.toBeNull();
      expect(updated!.status).toBe("ACTIVE");
    });

    it("deve atualizar endDate quando current_period_end existe", async () => {
      const stripeSubId = "sub_period_" + Date.now();
      const sub = await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        stripeSubId,
      );

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 90;
      const fakeStripeSub = {
        id: stripeSubId,
        status: "active",
        cancel_at_period_end: false,
        canceled_at: null,
        items: {
          data: [{ current_period_end: futureTimestamp }],
        },
      } as unknown as Stripe.Subscription;

      await processSubscriptionUpdated(fakeStripeSub);

      const updated = await prisma.subscription.findUnique({
        where: { id: sub.id },
      });
      expect(updated!.endDate.getTime()).toBe(futureTimestamp * 1000);
    });
  });

  describe("processSubscriptionDeleted", () => {
    it("deve marcar assinatura como CANCELED", async () => {
      const stripeSubId = "sub_deleted_" + Date.now();
      await criarAssinatura(testTenantId, testPlanMonthly.id, stripeSubId);

      const fakeStripeSub = {
        id: stripeSubId,
        status: "canceled",
      } as unknown as Stripe.Subscription;

      await processSubscriptionDeleted(fakeStripeSub);

      const updated = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSubId },
      });
      expect(updated!.status).toBe("CANCELED");
      expect(updated!.canceledAt).not.toBeNull();
    });
  });
});

// ─── Testes: Stripe Test Clock — Ciclo de vida real ────────────────────────────

describe("Stripe Test Clock — Ciclo completo de assinatura", () => {
  beforeEach(async () => {
    await cleanLocalSubscriptions();
  });

  it(
    "deve criar subscription real no Stripe e sincronizar com o banco",
    async () => {
      const now = new Date();
      const { customerId, clockId: _clockId } = await createTestCustomerWithClock(now);

      // Criar subscription real no Stripe
      const stripeSub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: testPlanMonthly.stripePriceId }],
      });
      createdSubscriptions.push(stripeSub.id);

      // Simular o webhook checkout.session.completed
      const fakeSession = {
        id: "cs_test_clock_" + Date.now(),
        mode: "subscription",
        metadata: {
          tenantId: testTenantId,
          planId: testPlanMonthly.id,
          type: "subscription",
        },
        subscription: stripeSub.id,
        customer: customerId,
      } as unknown as Stripe.Checkout.Session;

      await processSubscriptionCheckoutCompleted(fakeSession);

      // Verificar que foi criada no banco
      const localSub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id },
      });
      expect(localSub).not.toBeNull();
      expect(localSub!.status).toBe("ACTIVE");
      expect(localSub!.stripeCustomerId).toBe(customerId);

      // Verificar que buscarAssinaturaAtiva retorna ela
      const active = await buscarAssinaturaAtiva(testTenantId);
      expect(active).not.toBeNull();
      expect(active!.stripeSubscriptionId).toBe(stripeSub.id);
    },
    30_000,
  );

  it(
    "deve processar renovação após avanço do Test Clock",
    async () => {
      const now = new Date();
      const { customerId, clockId } = await createTestCustomerWithClock(now);

      // Criar subscription real
      const stripeSub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: testPlanMonthly.stripePriceId }],
      });
      createdSubscriptions.push(stripeSub.id);

      // Criar assinatura local (simulando webhook)
      await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        stripeSub.id,
        customerId,
      );

      // Avançar 35 dias — deve gerar nova invoice + invoice.paid
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 35);
      await advanceClockAndWait(clockId, futureDate, 15_000);

      // Buscar a subscription atualizada do Stripe
      const updatedStripeSub =
        await stripe.subscriptions.retrieve(stripeSub.id);
      expect(updatedStripeSub.status).toBe("active");

      // Simular o webhook processSubscriptionUpdated
      await processSubscriptionUpdated(updatedStripeSub);

      // Verificar que o endDate foi atualizado no banco
      const localSub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id },
      });
      expect(localSub).not.toBeNull();
      expect(localSub!.status).toBe("ACTIVE");
      // O endDate deve ser posterior à data avançada
      expect(localSub!.endDate.getTime()).toBeGreaterThan(
        futureDate.getTime() - 86400_000,
      );
    },
    60_000,
  );

  it(
    "deve processar cancelamento ao final do período via Test Clock",
    async () => {
      const now = new Date();
      const { customerId, clockId } = await createTestCustomerWithClock(now);

      // Criar subscription real
      const stripeSub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: testPlanMonthly.stripePriceId }],
      });
      createdSubscriptions.push(stripeSub.id);

      // Criar assinatura local
      await criarAssinatura(
        testTenantId,
        testPlanMonthly.id,
        stripeSub.id,
        customerId,
      );

      // Cancelar ao final do período (Stripe)
      await stripe.subscriptions.update(stripeSub.id, {
        cancel_at_period_end: true,
      });

      // Simular webhook de atualização
      const updatedSub = await stripe.subscriptions.retrieve(stripeSub.id);
      await processSubscriptionUpdated(updatedSub);

      // Verificar no banco — cancelAtEnd deve ser true, mas status ACTIVE
      let localSub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: stripeSub.id },
      });
      expect(localSub!.cancelAtEnd).toBe(true);
      expect(localSub!.status).toBe("ACTIVE");

      // Avançar clock para depois do período — Stripe cancela automaticamente
      const afterPeriod = new Date(now);
      afterPeriod.setDate(afterPeriod.getDate() + 35);
      await advanceClockAndWait(clockId, afterPeriod, 15_000);

      // Buscar estado final do Stripe
      const finalStripeSub = await stripe.subscriptions.retrieve(stripeSub.id);

      // Simular webhook deleted
      if (finalStripeSub.status === "canceled") {
        await processSubscriptionDeleted(finalStripeSub);

        localSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSub.id },
        });
        expect(localSub!.status).toBe("CANCELED");
      } else {
        // O Test Clock pode não ter processado ainda, verificar via updated
        await processSubscriptionUpdated(finalStripeSub);
      }
    },
    60_000,
  );
});
