import { Router } from "express";
import {
  buscarAssinatura,
  cancelarAssinatura,
  criarAssinatura,
  listarPlanos,
} from "../controllers/assinaturas";
import {
  adminRouteMiddleware,
  validarSchemaMiddleware,
  validarTokenMiddleware,
} from "../middlewares";
import criarAssinaturaSchema from "../schemas/assinaturas/criarAssinaturaSchema";

const assinaturasRoutes = Router({ mergeParams: true });

// Listar planos disponíveis (público — não requer autenticação)
assinaturasRoutes.get("/plans", listarPlanos);

// Buscar assinatura atual do tenant
assinaturasRoutes.get(
  "/",
  validarTokenMiddleware,
  adminRouteMiddleware,
  buscarAssinatura,
);

// Criar/contratar assinatura (redireciona para Stripe Checkout)
assinaturasRoutes.post(
  "/",
  validarTokenMiddleware,
  adminRouteMiddleware,
  validarSchemaMiddleware(criarAssinaturaSchema.shape.request, "REQUEST_BODY"),
  criarAssinatura,
);

// Cancelar assinatura ao final do período
assinaturasRoutes.post(
  "/cancel",
  validarTokenMiddleware,
  adminRouteMiddleware,
  cancelarAssinatura,
);

export default assinaturasRoutes;
