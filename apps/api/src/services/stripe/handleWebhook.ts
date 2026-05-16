import { Request } from "express";
import { STRIPE_WEBHOOK_SECRET } from "../../config/constants.js";
import { stripe } from "../../config/stripe.js";
import { NaoAutorizadoException } from "../../exceptions/NaoAutorizadoException.js";
import { NaoEncontradoException } from "../../exceptions/NaoEncontradoException.js";
import { confirmPayment } from "./confirmPayment";
import {
  processInvoicePaid,
  processInvoicePaymentFailed,
  processSubscriptionCheckoutCompleted,
  processSubscriptionDeleted,
  processSubscriptionUpdated,
} from "./handleSubscriptionWebhook";
import { processChargeRefunded } from "./processChargeRefunded";
import { processDisputeCreated } from "./processDisputeCreated";
import { releaseUnpaidOrderAfterCheckoutFailure } from "./releaseUnpaidOrderAfterCheckoutFailure";
import { syncConnectAccountStatus } from "./syncConnectAccountStatus";

export const handleStripeWebhook = async (req: Request) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    throw new NaoEncontradoException("Missing stripe-signature header");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    throw new NaoAutorizadoException(
      `Webhook signature verification failed: ${err.message}`,
    );
  }

  console.log(`✅ Webhook recebido: ${event.type}`);

  switch (event.type) {
    // --- SUCESSO (Ingressos) ---
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Verificar se é checkout de assinatura ou de ingressos
      if (session.mode === "subscription") {
        await processSubscriptionCheckoutCompleted(session);
        console.log(`💳 Assinatura checkout confirmado: ${session.id}`);
      } else {
        await confirmPayment(session.id);
        console.log(`💰 Pagamento confirmado: ${session.id}`);
      }
      break;
    }

    // --- FALHA / EXPIRAÇÃO (Ingressos) ---
    case "checkout.session.async_payment_failed":
      await releaseUnpaidOrderAfterCheckoutFailure(
        event.data.object.id,
        "FAILED",
      );
      console.log(`❌ Pagamento falhou: ${event.data.object.id}`);
      break;

    case "checkout.session.expired":
      await releaseUnpaidOrderAfterCheckoutFailure(
        event.data.object.id,
        "EXPIRED",
      );
      console.log(`⏳ Checkout expirado: ${event.data.object.id}`);
      break;

    // --- ATUALIZAÇÃO DO ORGANIZADOR ---
    case "account.updated":
      await syncConnectAccountStatus(undefined, event.data.object.id);
      console.log(`🔄 Conta atualizada: ${event.data.object.id}`);
      // TODO: Atualizar stripeAccount no banco
      break;

    // --- REEMBOLSOS ---
    case "charge.refunded":
      await processChargeRefunded(event.data.object);
      console.log(`↩️ Pagamento devolvido: ${event.data.object.id}`);
      break;

    case "charge.dispute.created":
      await processDisputeCreated(event.data.object);
      console.log(`⚠️ Disputa criada: ${event.data.object.id}`);
      break;

    // --- ASSINATURAS ---
    case "invoice.paid":
      await processInvoicePaid(event.data.object);
      console.log(`💳 Invoice paga: ${event.data.object.id}`);
      break;

    case "invoice.payment_failed":
      await processInvoicePaymentFailed(event.data.object);
      console.log(`❌ Invoice falhou: ${event.data.object.id}`);
      break;

    case "customer.subscription.updated":
      await processSubscriptionUpdated(event.data.object);
      console.log(`🔄 Assinatura atualizada: ${event.data.object.id}`);
      break;

    case "customer.subscription.deleted":
      await processSubscriptionDeleted(event.data.object);
      console.log(`❌ Assinatura deletada: ${event.data.object.id}`);
      break;

    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  return { received: true };
};
