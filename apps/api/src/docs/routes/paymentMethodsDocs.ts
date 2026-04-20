import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import notFoundErroSchema from "../../schemas/error/notFoundErroSchema";
import servidorErroSchema from "../../schemas/error/servidorErroSchema";
import validationErroSchema from "../../schemas/error/validationErroSchema";
import calculateFeesSchema from "../../schemas/payment/calculateFeesSchema";
import listPaymentMethodsSchema from "../../schemas/payment/listPaymentMethodsSchema";

const paymentMethodsRegistry = new OpenAPIRegistry();

// === Registrar schemas ===

const ListPaymentMethodsResponseRegister = paymentMethodsRegistry.register(
  "ListPaymentMethodsResponse",
  listPaymentMethodsSchema.shape.response,
);

const CalculateFeesRequestRegister = paymentMethodsRegistry.register(
  "CalculateFeesRequest",
  calculateFeesSchema.shape.request,
);
const CalculateFeesResponseRegister = paymentMethodsRegistry.register(
  "CalculateFeesResponse",
  calculateFeesSchema.shape.response,
);

// === Respostas comuns ===

const commonResponses = {
  404: {
    description: "Recurso não encontrado",
    content: { "application/json": { schema: notFoundErroSchema } },
  },
  500: {
    description: "Erro interno do servidor",
    content: { "application/json": { schema: servidorErroSchema } },
  },
};

const validationResponse = {
  422: {
    description: "Erro de validação",
    content: { "application/json": { schema: validationErroSchema } },
  },
};

// === Rotas ===

// GET /:tenantSlug/payment-methods — Listar métodos de pagamento
paymentMethodsRegistry.registerPath({
  method: "get",
  path: "/{tenantSlug}/payment-methods",
  tags: ["Métodos de Pagamento"],
  summary: "Listar métodos de pagamento",
  description:
    "Retorna os métodos de pagamento disponíveis para o provider configurado (ex: Stripe), incluindo taxas e opções de parcelamento.",
  responses: {
    200: {
      description: "Métodos de pagamento retornados",
      content: {
        "application/json": { schema: ListPaymentMethodsResponseRegister },
      },
    },
    ...commonResponses,
  },
});

// POST /:tenantSlug/payment-methods/calculate — Calcular taxas
paymentMethodsRegistry.registerPath({
  method: "post",
  path: "/{tenantSlug}/payment-methods/calculate",
  tags: ["Métodos de Pagamento"],
  summary: "Calcular taxas de pagamento",
  description:
    "Calcula as taxas (plataforma, gateway) e opções de parcelamento para um subtotal e método de pagamento específicos. Útil para exibir o resumo de custos ao usuário antes do checkout.",
  request: {
    body: {
      content: {
        "application/json": { schema: CalculateFeesRequestRegister },
      },
    },
  },
  responses: {
    200: {
      description: "Taxas calculadas",
      content: {
        "application/json": { schema: CalculateFeesResponseRegister },
      },
    },
    ...commonResponses,
    ...validationResponse,
  },
});

export default paymentMethodsRegistry;
