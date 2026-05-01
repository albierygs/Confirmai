import { RequestHandler } from "express";
import { NaoEncontradoException, ProibidoException } from "../exceptions";
import { buscarAssinaturaAtiva } from "../services/assinaturaService";

const verificarAssinaturaMiddleware: RequestHandler<
  any,
  any,
  any,
  any
> = async (req, _res, next) => {
  if (!req.tenant) {
    throw new NaoEncontradoException("Tenant não encontrado");
  }

  // Global admin bypassa verificação de assinatura
  if (req.user?.cargo === "global_admin") {
    return next();
  }

  const subscription = await buscarAssinaturaAtiva(req.tenant.id);

  if (!subscription) {
    throw new ProibidoException(
      req.user?.cargo === "admin"
        ? "Assinatura inativa ou expirada. Contrate um plano para continuar."
        : "Tenant não habilitado para uso",
    );
  }

  req.subscription = {
    id: subscription.id,
    planId: subscription.planId,
    status: subscription.status,
    endDate: subscription.endDate,
  };

  next();
};

export default verificarAssinaturaMiddleware;
