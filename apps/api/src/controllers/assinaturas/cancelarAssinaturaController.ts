import { RequestHandler } from "express";
import { NaoAutorizadoException, NaoEncontradoException } from "../../exceptions";
import { CancelarAssinaturaResponseSchema } from "../../schemas/assinaturas/cancelarAssinaturaSchema";
import { buscarAssinaturaAtiva, cancelarAssinatura } from "../../services/assinaturaService";
import { cancelarStripeSubscription } from "../../services/stripe/stripeSubscriptionService";

const cancelarAssinaturaController: RequestHandler<
  any,
  CancelarAssinaturaResponseSchema
> = async (req, res) => {
  if (!req.tenant) {
    throw new NaoAutorizadoException("Tenant não identificado");
  }

  // Buscar assinatura ativa antes de cancelar
  const assinaturaAtiva = await buscarAssinaturaAtiva(req.tenant.id);

  if (!assinaturaAtiva) {
    throw new NaoEncontradoException("Nenhuma assinatura ativa encontrada");
  }

  // Cancelar no Stripe (ao final do período)
  if (assinaturaAtiva.stripeSubscriptionId) {
    await cancelarStripeSubscription(assinaturaAtiva.stripeSubscriptionId);
  }

  // Cancelar no banco local
  const subscription = await cancelarAssinatura(req.tenant.id);

  const assinatura = {
    ...subscription,
    plan: {
      ...subscription.plan,
      price: Number(subscription.plan.price),
    },
  };

  res.json({
    mensagem: "Assinatura será cancelada ao final do período",
    assinatura,
  });
};

export default cancelarAssinaturaController;
