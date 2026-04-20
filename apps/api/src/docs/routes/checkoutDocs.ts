import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import notFoundErroSchema from "../../schemas/error/notFoundErroSchema";
import servidorErroSchema from "../../schemas/error/servidorErroSchema";
import unauthorizedErroSchema from "../../schemas/error/unauthorizedErroSchema";
import validationErroSchema from "../../schemas/error/validationErroSchema";
import createCheckoutSchema from "../../schemas/payment/createCheckoutSchema";
import getCheckoutStatusSchema from "../../schemas/payment/getCheckoutStatusSchema";

const checkoutRegistry = new OpenAPIRegistry();

// === Registrar schemas ===

const CreateCheckoutResponseRegister = checkoutRegistry.register(
  "CreateCheckoutResponse",
  createCheckoutSchema.shape.response,
);

const GetCheckoutStatusParamsRegister = checkoutRegistry.register(
  "GetCheckoutStatusParams",
  getCheckoutStatusSchema.shape.params,
);
const GetCheckoutStatusResponseRegister = checkoutRegistry.register(
  "GetCheckoutStatusResponse",
  getCheckoutStatusSchema.shape.response,
);

// === Respostas comuns ===

const commonResponses = {
  401: {
    description: "Não autenticado",
    content: { "application/json": { schema: unauthorizedErroSchema } },
  },
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

// POST /:tenantSlug/checkout — Criar checkout
checkoutRegistry.registerPath({
  method: "post",
  path: "/{tenantSlug}/checkout",
  tags: ["Checkout"],
  summary: "Criar sessão de checkout",
  description:
    "Cria um pedido a partir da reserva ativa do usuário e inicia uma sessão de pagamento no Stripe. Retorna a URL de redirecionamento para o Stripe Checkout.",
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: "Sessão de checkout criada",
      content: {
        "application/json": { schema: CreateCheckoutResponseRegister },
      },
    },
    ...commonResponses,
    ...validationResponse,
  },
});

// GET /:tenantSlug/orders/:orderId — Status do pedido
checkoutRegistry.registerPath({
  method: "get",
  path: "/{tenantSlug}/orders/{orderId}",
  tags: ["Checkout"],
  summary: "Consultar status do pedido",
  description:
    "Retorna os detalhes e o status de um pedido, incluindo itens, valores e informações de pagamento.",
  security: [{ bearerAuth: [] }],
  request: {
    params: GetCheckoutStatusParamsRegister,
  },
  responses: {
    200: {
      description: "Pedido retornado",
      content: {
        "application/json": { schema: GetCheckoutStatusResponseRegister },
      },
    },
    ...commonResponses,
    ...validationResponse,
  },
});

// POST /webhooks/stripe — Webhook Stripe
checkoutRegistry.registerPath({
  method: "post",
  path: "/webhooks/stripe",
  tags: ["Checkout"],
  summary: "Webhook do Stripe",
  description:
    "Endpoint para receber eventos do Stripe (pagamento confirmado, expirado, falha, reembolso, etc). Requer raw body e assinatura stripe-signature no header.",
  responses: {
    200: {
      description: "Evento processado",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              received: { type: "boolean", example: true },
            },
          },
        },
      },
    },
    401: {
      description: "Assinatura do webhook inválida",
      content: { "application/json": { schema: unauthorizedErroSchema } },
    },
    404: {
      description: "Header stripe-signature ausente",
      content: { "application/json": { schema: notFoundErroSchema } },
    },
    500: {
      description: "Erro interno do servidor",
      content: { "application/json": { schema: servidorErroSchema } },
    },
  },
});

export default checkoutRegistry;
