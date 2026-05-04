import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import forbiddenErroSchema from "../../schemas/error/forbiddenErroSchema";
import notFoundErroSchema from "../../schemas/error/notFoundErroSchema";
import servidorErroSchema from "../../schemas/error/servidorErroSchema";
import unauthorizedErroSchema from "../../schemas/error/unauthorizedErroSchema";
import validationErroSchema from "../../schemas/error/validationErroSchema";
import buscarAssinaturaSchema from "../../schemas/assinaturas/buscarAssinaturaSchema";
import cancelarAssinaturaSchema from "../../schemas/assinaturas/cancelarAssinaturaSchema";
import criarAssinaturaSchema from "../../schemas/assinaturas/criarAssinaturaSchema";
import listarPlanosSchema from "../../schemas/assinaturas/listarPlanosSchema";

const assinaturasRegistry = new OpenAPIRegistry();

// Registrar schemas
const ListarPlanosResponseRegister = assinaturasRegistry.register(
  "ListarPlanosResponse",
  listarPlanosSchema.shape.response,
);

const BuscarAssinaturaResponseRegister = assinaturasRegistry.register(
  "BuscarAssinaturaResponse",
  buscarAssinaturaSchema.shape.response,
);

const CriarAssinaturaRequestRegister = assinaturasRegistry.register(
  "CriarAssinaturaRequest",
  criarAssinaturaSchema.shape.request,
);

const CriarAssinaturaResponseRegister = assinaturasRegistry.register(
  "CriarAssinaturaResponse",
  criarAssinaturaSchema.shape.response,
);

const CancelarAssinaturaResponseRegister = assinaturasRegistry.register(
  "CancelarAssinaturaResponse",
  cancelarAssinaturaSchema.shape.response,
);

// GET /tenants/:tenantSlug/assinaturas/plans — Listar planos
assinaturasRegistry.registerPath({
  method: "get",
  path: "/tenants/{tenantSlug}/assinaturas/plans",
  tags: ["Assinaturas"],
  summary: "Listar planos disponíveis",
  description:
    "Retorna todos os planos de assinatura ativos disponíveis para contratação.",
  responses: {
    200: {
      description: "Planos retornados",
      content: {
        "application/json": { schema: ListarPlanosResponseRegister },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": { schema: servidorErroSchema },
      },
    },
  },
});

// GET /tenants/:tenantSlug/assinaturas — Buscar assinatura atual
assinaturasRegistry.registerPath({
  method: "get",
  path: "/tenants/{tenantSlug}/assinaturas",
  tags: ["Assinaturas"],
  summary: "Buscar assinatura atual do tenant",
  description:
    "Retorna a assinatura ativa do tenant ou null se não houver nenhuma.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Assinatura retornada",
      content: {
        "application/json": { schema: BuscarAssinaturaResponseRegister },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: unauthorizedErroSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: forbiddenErroSchema },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": { schema: servidorErroSchema },
      },
    },
  },
});

// POST /tenants/:tenantSlug/assinaturas — Criar assinatura
assinaturasRegistry.registerPath({
  method: "post",
  path: "/tenants/{tenantSlug}/assinaturas",
  tags: ["Assinaturas"],
  summary: "Criar/contratar assinatura",
  description:
    "Cria uma sessão de checkout no Stripe para contratação do plano escolhido. Retorna a URL de checkout para o admin completar o pagamento.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: CriarAssinaturaRequestRegister },
      },
    },
  },
  responses: {
    201: {
      description: "Checkout criado",
      content: {
        "application/json": { schema: CriarAssinaturaResponseRegister },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: unauthorizedErroSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: forbiddenErroSchema },
      },
    },
    404: {
      description: "Plano não encontrado",
      content: {
        "application/json": { schema: notFoundErroSchema },
      },
    },
    422: {
      description: "Erro na validação dos dados",
      content: {
        "application/json": { schema: validationErroSchema },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": { schema: servidorErroSchema },
      },
    },
  },
});

// POST /tenants/:tenantSlug/assinaturas/cancel — Cancelar assinatura
assinaturasRegistry.registerPath({
  method: "post",
  path: "/tenants/{tenantSlug}/assinaturas/cancel",
  tags: ["Assinaturas"],
  summary: "Cancelar assinatura",
  description:
    "Cancela a assinatura ao final do período atual. O tenant mantém acesso até a data de término.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Assinatura marcada para cancelamento",
      content: {
        "application/json": { schema: CancelarAssinaturaResponseRegister },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: unauthorizedErroSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: forbiddenErroSchema },
      },
    },
    404: {
      description: "Assinatura não encontrada",
      content: {
        "application/json": { schema: notFoundErroSchema },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": { schema: servidorErroSchema },
      },
    },
  },
});

export default assinaturasRegistry;
