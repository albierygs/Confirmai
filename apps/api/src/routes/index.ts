import { Router } from "express";
import {
  identificarTenantMiddleware,
  validarSchemaMiddleware,
} from "../middlewares";
import paramTenantSlugSchema from "../schemas/tenantSlugParamSchema";
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

routes.use(
  "/:tenantSlug",
  validarSchemaMiddleware(paramTenantSlugSchema, "PARAMS"),
  identificarTenantMiddleware,
);

routes.use("/:tenantSlug/eventos", eventosRoutes);
routes.use("/:tenantSlug/cart", cartRoutes);
routes.use("/:tenantSlug/tickets", ticketsRoutes);
routes.use("/:tenantSlug/payment-methods", paymentMethodsRoutes);

export default routes;
