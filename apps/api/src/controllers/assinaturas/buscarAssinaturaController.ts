import { RequestHandler } from "express";
import { NaoAutorizadoException } from "../../exceptions";
import { buscarAssinaturaAtiva } from "../../services/assinaturaService";
import { BuscarAssinaturaResponseSchema } from "../../schemas/assinaturas/buscarAssinaturaSchema";

const buscarAssinatura: RequestHandler<
  any,
  BuscarAssinaturaResponseSchema
> = async (req, res) => {
  if (!req.tenant) {
    throw new NaoAutorizadoException("Tenant não identificado");
  }

  const subscription = await buscarAssinaturaAtiva(req.tenant.id);

  if (!subscription) {
    res.json({ assinatura: null });
    return;
  }

  const assinatura = {
    ...subscription,
    plan: {
      ...subscription.plan,
      price: Number(subscription.plan.price),
    },
  };

  res.json({ assinatura });
};

export default buscarAssinatura;
