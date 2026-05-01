import { Router } from "express";
import {
  identificarTenantMiddleware,
  validarSchemaMiddleware,
  verificarAssinaturaMiddleware,
} from "../middlewares";
import paramTenantSlugSchema from "../schemas/tenantSlugParamSchema";
import assinaturasRoutes from "./assinaturasRoutes";
import cartRoutes from "./cartRoutes";
import checkoutRoutes from "./checkoutRoutes";
import eventosRoutes from "./eventosRoutes";
import paymentMethodsRoutes from "./paymentMethodRoutes";
import tenantsRoutes from "./tenantsRoutes";
import ticketsRoutes from "./ticketsRoutes";
import usuariosRoutes from "./usuariosRoutes";

const routes = Router({ mergeParams: true });

routes.get("/", (_req, res) => {
  res.send(`Servidor rodando na porta ${process.env.PORT}`);
});

routes.use("/tenants", tenantsRoutes);
routes.use("/usuarios", usuariosRoutes);
routes.use("/", checkoutRoutes);

// Identificar tenant para todas as rotas /:tenantSlug
routes.use(
  "/:tenantSlug",
  validarSchemaMiddleware(paramTenantSlugSchema, "PARAMS"),
  identificarTenantMiddleware,
);

// Rotas de assinaturas (acessíveis SEM assinatura ativa para permitir contratação)
routes.use("/:tenantSlug/assinaturas", assinaturasRoutes);

// Middleware de assinatura — bloqueia acesso se não houver assinatura ativa
routes.use("/:tenantSlug", verificarAssinaturaMiddleware);

// Rotas protegidas por assinatura
routes.use("/:tenantSlug/eventos", eventosRoutes);
routes.use("/:tenantSlug/cart", cartRoutes);
routes.use("/:tenantSlug/tickets", ticketsRoutes);
routes.use("/:tenantSlug/payment-methods", paymentMethodsRoutes);

export default routes;
