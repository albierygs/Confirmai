import { RequestHandler } from "express";
import { NaoAutorizadoException } from "../../exceptions";
import {
  CriarAssinaturaRequestSchema,
  CriarAssinaturaResponseSchema,
} from "../../schemas/assinaturas/criarAssinaturaSchema";
import { criarStripeSubscriptionCheckout } from "../../services/stripe/stripeSubscriptionService";

const criarAssinatura: RequestHandler<
  any,
  CriarAssinaturaResponseSchema,
  CriarAssinaturaRequestSchema
> = async (req, res) => {
  if (!req.tenant) {
    throw new NaoAutorizadoException("Tenant não identificado");
  }

  const { planId } = req.body;

  const { checkoutUrl, sessionId } = await criarStripeSubscriptionCheckout(
    req.tenant!.id,
    planId,
  );

  res.status(201).json({
    mensagem: "Redirecionando para o checkout",
    checkoutUrl: checkoutUrl!,
    checkoutSessionId: sessionId,
  });
};

export default criarAssinatura;
