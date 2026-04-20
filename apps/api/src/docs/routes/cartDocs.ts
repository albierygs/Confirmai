import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { adicionarAoCarrinhoSchema } from "../../schemas/cart/adicionarAoCarrinhoSchema";
import { buscarCarrinhoSchema } from "../../schemas/cart/buscarCarrinhoSchema";
import { buscarDisponibilidadeSchema } from "../../schemas/cart/buscarDisponibilidadeSchema";
import { limparCarrinhoSchema } from "../../schemas/cart/limparCarrinhoSchema";
import { removerDoCarrinhoSchema } from "../../schemas/cart/removerDoCarrinhoSchema";
import notFoundErroSchema from "../../schemas/error/notFoundErroSchema";
import servidorErroSchema from "../../schemas/error/servidorErroSchema";
import unauthorizedErroSchema from "../../schemas/error/unauthorizedErroSchema";
import validationErroSchema from "../../schemas/error/validationErroSchema";

const cartRegistry = new OpenAPIRegistry();

// === Registrar schemas ===

const AdicionarAoCarrinhoRequestRegister = cartRegistry.register(
  "AdicionarAoCarrinhoRequest",
  adicionarAoCarrinhoSchema.shape.request,
);
const AdicionarAoCarrinhoResponseRegister = cartRegistry.register(
  "AdicionarAoCarrinhoResponse",
  adicionarAoCarrinhoSchema.shape.response,
);

const BuscarCarrinhoResponseRegister = cartRegistry.register(
  "BuscarCarrinhoResponse",
  buscarCarrinhoSchema.shape.response,
);

const BuscarDisponibilidadeParamsRegister = cartRegistry.register(
  "BuscarDisponibilidadeParams",
  buscarDisponibilidadeSchema.shape.params,
);
const BuscarDisponibilidadeResponseRegister = cartRegistry.register(
  "BuscarDisponibilidadeResponse",
  buscarDisponibilidadeSchema.shape.response,
);

const RemoverDoCarrinhoRequestRegister = cartRegistry.register(
  "RemoverDoCarrinhoRequest",
  removerDoCarrinhoSchema.shape.request,
);
const RemoverDoCarrinhoResponseRegister = cartRegistry.register(
  "RemoverDoCarrinhoResponse",
  removerDoCarrinhoSchema.shape.response,
);

const LimparCarrinhoResponseRegister = cartRegistry.register(
  "LimparCarrinhoResponse",
  limparCarrinhoSchema.shape.response,
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

// POST /:tenantSlug/cart/items — Adicionar ao carrinho
cartRegistry.registerPath({
  method: "post",
  path: "/{tenantSlug}/cart/items",
  tags: ["Carrinho"],
  summary: "Adicionar ingresso ao carrinho",
  description:
    "Define a quantidade de um tipo de ingresso no carrinho do usuário. Se a quantidade for 0, remove o item. Cria a reserva automaticamente se não existir.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: AdicionarAoCarrinhoRequestRegister },
      },
    },
  },
  responses: {
    200: {
      description: "Ingresso adicionado/atualizado no carrinho",
      content: {
        "application/json": { schema: AdicionarAoCarrinhoResponseRegister },
      },
    },
    ...commonResponses,
    ...validationResponse,
  },
});

// GET /:tenantSlug/cart — Buscar carrinho
cartRegistry.registerPath({
  method: "get",
  path: "/{tenantSlug}/cart",
  tags: ["Carrinho"],
  summary: "Buscar carrinho do usuário",
  description:
    "Retorna os itens do carrinho (reserva ativa) do usuário para o tenant atual, com preços e totais calculados.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Carrinho retornado",
      content: {
        "application/json": { schema: BuscarCarrinhoResponseRegister },
      },
    },
    ...commonResponses,
  },
});

// DELETE /:tenantSlug/cart/remove — Remover do carrinho
cartRegistry.registerPath({
  method: "delete",
  path: "/{tenantSlug}/cart/remove",
  tags: ["Carrinho"],
  summary: "Remover ingresso do carrinho",
  description:
    "Remove um tipo de ingresso do carrinho. Se for o último item, cancela a reserva automaticamente.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: RemoverDoCarrinhoRequestRegister },
      },
    },
  },
  responses: {
    200: {
      description: "Ingresso removido do carrinho",
      content: {
        "application/json": { schema: RemoverDoCarrinhoResponseRegister },
      },
    },
    ...commonResponses,
    ...validationResponse,
  },
});

// DELETE /:tenantSlug/cart/clear — Limpar carrinho
cartRegistry.registerPath({
  method: "delete",
  path: "/{tenantSlug}/cart/clear",
  tags: ["Carrinho"],
  summary: "Limpar carrinho",
  description:
    "Remove todos os itens do carrinho do usuário para o tenant atual e cancela a reserva.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Carrinho limpo",
      content: {
        "application/json": { schema: LimparCarrinhoResponseRegister },
      },
    },
    ...commonResponses,
  },
});

// GET /:tenantSlug/tickets/:batchTicketId/availability — Disponibilidade
cartRegistry.registerPath({
  method: "get",
  path: "/{tenantSlug}/tickets/{batchTicketId}/availability",
  tags: ["Carrinho"],
  summary: "Verificar disponibilidade de ingresso",
  description:
    "Retorna a quantidade disponível de um tipo de ingresso, descontando vendas e reservas ativas.",
  security: [{ bearerAuth: [] }],
  request: {
    params: BuscarDisponibilidadeParamsRegister,
  },
  responses: {
    200: {
      description: "Disponibilidade retornada",
      content: {
        "application/json": { schema: BuscarDisponibilidadeResponseRegister },
      },
    },
    ...commonResponses,
    ...validationResponse,
  },
});

export default cartRegistry;
