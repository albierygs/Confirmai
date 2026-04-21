import express, { Router } from "express";
import createCheckout from "../controllers/checkout/createCheckoutController";
import getCheckoutStatus from "../controllers/checkout/getCheckoutStatusController";
import listUserOrders from "../controllers/checkout/listUserOrdersController";
import handleWebhook from "../controllers/checkout/handleWebhookController.js";
import identificarTenantMiddleware from "../middlewares/identificarTenantMiddleware.js";
import validarSchemaMiddleware from "../middlewares/validarSchemaMiddleware.js";
import validarTokenMiddleware from "../middlewares/validarTokenMiddleware.js";
import createCheckoutSchema from "../schemas/payment/createCheckoutSchema.js";
import listUserOrdersSchema from "../schemas/payment/listUserOrdersSchema";
import paramTenantSlugSchema from "../schemas/tenantSlugParamSchema.js";

const checkoutRoutes = Router();

// Webhook (raw body)
checkoutRoutes.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

checkoutRoutes.use(
  "/:tenantSlug",
  validarSchemaMiddleware(paramTenantSlugSchema, "PARAMS"),
  identificarTenantMiddleware,
);

// Rotas protegidas
checkoutRoutes.post(
  "/:tenantSlug/checkout",
  validarTokenMiddleware,
  validarSchemaMiddleware(createCheckoutSchema.shape.request, "REQUEST_BODY"),
  createCheckout,
);

checkoutRoutes.get(
  "/:tenantSlug/orders",
  validarTokenMiddleware,
  validarSchemaMiddleware(listUserOrdersSchema.shape.query, "QUERY"),
  listUserOrders,
);

checkoutRoutes.get(
  "/:tenantSlug/orders/:orderId",
  validarTokenMiddleware,
  getCheckoutStatus,
);

export default checkoutRoutes;
