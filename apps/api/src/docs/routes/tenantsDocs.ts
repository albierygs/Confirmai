import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import badRequestErroSchema from "../../schemas/error/badRequestErroSchema";
import conflictErroSchema from "../../schemas/error/conflictErroSchema";
import forbiddenErroSchema from "../../schemas/error/forbiddenErroSchema";
import notFoundErroSchema from "../../schemas/error/notFoundErroSchema";
import servidorErroSchema from "../../schemas/error/servidorErroSchema";
import unauthorizedErroSchema from "../../schemas/error/unauthorizedErroSchema";
import validationErroSchema from "../../schemas/error/validationErroSchema";
import buscarTenantSchema from "../../schemas/tenants/buscarTenantSchema";
import buscarTodasTenantsSchema from "../../schemas/tenants/buscarTodasTenantsSchema";
import criarTenantSchema from "../../schemas/tenants/criarTenantSchema";
import editarTenantSchema from "../../schemas/tenants/editarTenantSchema";
import { onboardTenantSchema } from "../../schemas/tenants/onboardTenantSchema";
import { verifyTenantStatusSchema } from "../../schemas/tenants/verifyTenantStatusSchema";
import eventosRegistry from "./eventosDocs";

const tenantsRegistry = new OpenAPIRegistry();

const CriarTenantRequestRegister = eventosRegistry.register(
  "CriarTenantRequest",
  criarTenantSchema.shape.request,
);
const CriarTenantResponseRegister = eventosRegistry.register(
  "CriarTenantResponse",
  criarTenantSchema.shape.response,
);

const BuscarTenantResponseRegister = eventosRegistry.register(
  "BuscarTenantResponse",
  buscarTenantSchema.shape.response,
);

const BuscarTodasTenantsResponseRegister = eventosRegistry.register(
  "BuscarTodasTenantsResponse",
  buscarTodasTenantsSchema.shape.response,
);

const EditarTenantResponseRegister = eventosRegistry.register(
  "EditarTenantResponse",
  editarTenantSchema.shape.response,
);
const EditarTenantRequestRegister = eventosRegistry.register(
  "EditarTenantRequest",
  editarTenantSchema.shape.request,
);

const OnboardTenantResponseRegister = tenantsRegistry.register(
  "OnboardTenantResponse",
  onboardTenantSchema.shape.response,
);

const VerifyTenantStatusResponseRegister = tenantsRegistry.register(
  "VerifyTenantStatusResponse",
  verifyTenantStatusSchema.shape.response,
);

// Criar Tenant
eventosRegistry.registerPath({
  method: "post",
  path: "/tenants/",
  tags: ["Tenants"],
  summary: "Cria uma nova tenant",
  request: {
    body: {
      content: {
        "application/json": { schema: CriarTenantRequestRegister },
      },
    },
  },
  responses: {
    201: {
      description: "Tenant criada",
      content: {
        "application/json": { schema: CriarTenantResponseRegister },
      },
    },
    409: {
      description: "Conflict",
      content: {
        "application/json": { schema: conflictErroSchema },
      },
    },
    422: {
      description: "Erro na validação dos dados do body",
      content: {
        "application/json": {
          schema: validationErroSchema,
        },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": {
          schema: servidorErroSchema,
        },
      },
    },
  },
});

// Detalhes Tenant
eventosRegistry.registerPath({
  method: "get",
  path: "/tenants/{tenantSlug}/",
  tags: ["Tenants"],
  summary: "Detalhes tenant",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Tenant retornada",
      content: {
        "application/json": { schema: BuscarTenantResponseRegister },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": { schema: badRequestErroSchema },
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
      description: "Not Found",
      content: {
        "application/json": { schema: notFoundErroSchema },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": {
          schema: servidorErroSchema,
        },
      },
    },
  },
});

// Listar Tenants
eventosRegistry.registerPath({
  method: "get",
  path: "/tenants/all",
  tags: ["Tenants"],
  summary: "Listar todos as tenants",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Tenants retornadas",
      content: {
        "application/json": { schema: BuscarTodasTenantsResponseRegister },
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
      description: "Not Found",
      content: {
        "application/json": { schema: notFoundErroSchema },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": {
          schema: servidorErroSchema,
        },
      },
    },
  },
});

// Editar Tenant
eventosRegistry.registerPath({
  method: "put",
  path: "/tenants/{tenantSlug}/",
  tags: ["Tenants"],
  summary: "Editar tenant",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: EditarTenantRequestRegister,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Tenant atualizada",
      content: {
        "application/json": { schema: EditarTenantResponseRegister },
      },
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": { schema: badRequestErroSchema },
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
      description: "Not Found",
      content: {
        "application/json": { schema: notFoundErroSchema },
      },
    },
    409: {
      description: "Conflict",
      content: {
        "application/json": { schema: conflictErroSchema },
      },
    },
    422: {
      description: "Erro na validação dos dados do body",
      content: {
        "application/json": {
          schema: validationErroSchema,
        },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": {
          schema: servidorErroSchema,
        },
      },
    },
  },
});

// Deletar Tenant
eventosRegistry.registerPath({
  method: "delete",
  path: "/tenants/{tenantSlug}/",
  tags: ["Tenants"],
  summary: "Deletar tenant",
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Tenant deletada",
    },
    400: {
      description: "Bad Request",
      content: {
        "application/json": { schema: badRequestErroSchema },
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
      description: "Not Found",
      content: {
        "application/json": { schema: notFoundErroSchema },
      },
    },
    500: {
      description: "Erro interno do servidor",
      content: {
        "application/json": {
          schema: servidorErroSchema,
        },
      },
    },
  },
});

// === Stripe Connect ===

// POST /tenants/:tenantSlug/payments/connect/onboard — Onboarding Stripe
tenantsRegistry.registerPath({
  method: "post",
  path: "/tenants/{tenantSlug}/payments/connect/onboard",
  tags: ["Tenants - Stripe Connect"],
  summary: "Iniciar onboarding Stripe Connect",
  description:
    "Cria ou recupera a conta Stripe Connect do tenant e retorna a URL de onboarding para o administrador completar o cadastro.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "URL de onboarding retornada",
      content: {
        "application/json": { schema: OnboardTenantResponseRegister },
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
      description: "Not Found",
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

// GET /tenants/:tenantSlug/payments/connect/verify — Verificar status
tenantsRegistry.registerPath({
  method: "get",
  path: "/tenants/{tenantSlug}/payments/connect/verify",
  tags: ["Tenants - Stripe Connect"],
  summary: "Verificar status da conta Stripe Connect",
  description:
    "Sincroniza e retorna o status atual da conta Stripe Connect do tenant (charges, payouts, detailsSubmitted).",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Status da conta retornado",
      content: {
        "application/json": { schema: VerifyTenantStatusResponseRegister },
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
      description: "Not Found",
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

// GET /tenants/:tenantSlug/payments/connect/login — Login link
tenantsRegistry.registerPath({
  method: "get",
  path: "/tenants/{tenantSlug}/payments/connect/login",
  tags: ["Tenants - Stripe Connect"],
  summary: "Gerar link de login no Stripe Dashboard",
  description:
    "Gera um link de acesso ao dashboard do Stripe para o administrador da tenant gerenciar pagamentos, reembolsos e configurações.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Login link gerado",
      content: {
        "application/json": { schema: OnboardTenantResponseRegister },
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
      description: "Not Found",
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

export default tenantsRegistry;

