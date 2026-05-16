# Confirma.ai

Confirma.ai é um SaaS multi-tenant para operação de eventos, inscrições e venda de ingressos. Cada empresa ou organização atua em um tenant próprio, com seus eventos, participantes, lotes, tickets e regras de acesso isoladas do restante da plataforma.

## O que o produto faz

O sistema permite que uma operação crie e gerencie eventos, cadastre lotes e tipos de ingresso, acompanhe inscrições, gere tickets e prepare a base para check-in e pagamento. A plataforma também possui suporte a um administrador global, útil para inicialização e manutenção da base comum do sistema.

## Regras de negócio

O domínio atual do projeto segue estas regras:

- Cada tenant representa uma empresa ou organização e pode estar com status `ativo`, `suspenso` ou `cancelado`.
- Todo evento pertence a um tenant.
- O evento é criado com status `ativo` por padrão; o fluxo também aceita `rascunho` e `encerrado`.
- O `linkSlug` identifica o evento na URL e é usado para navegação e integração entre telas e API.
- Os lotes representam janelas de venda ou faixas de ingresso. Eles têm data de início, data de fim e indicador de ativação.
- O seed inicial cria o administrador global, tipos de ingresso padrão e o provedor de pagamento Stripe com métodos básicos já cadastrados.
- Os tickets são gerados a partir do fluxo de compra/inscrição e podem ser usados no check-in.
- A integração com pagamento foi desenhada para Stripe, com suporte estrutural para evolução futura.

## Stack

- Monorepo com [PNPM](https://pnpm.io/) e [Turborepo](https://turbo.build/)
- Backend em `apps/api` com Node.js, Express, TypeScript, Prisma e MySQL
- Frontend em `apps/web` com Next.js, React e Tailwind CSS
- Ambiente local com Docker e Docker Compose

## Estrutura

```text
.
├── apps/
│   ├── api/   # Backend Express + Prisma
│   └── web/   # Frontend Next.js
├── docker-compose.yml
├── jest.config.js
├── pnpm-workspace.yaml
└── turbo.json
```

## Como rodar

### Pré-requisitos

- Node.js 20+
- PNPM
- Docker e Docker Compose

### Instalação

```bash
pnpm install
```

### Subir o banco

```bash
docker compose up -d
```

### Rodar a aplicação

```bash
pnpm dev
```

## Configuração do `.env`

### Backend: `apps/api/.env`

Use este arquivo para a API local:

```bash
PORT=4000
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=3307
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=confirma_ai_db
DATABASE_URL="mysql://root:root@localhost:3307/confirma_ai_db"

JWT_SECRET="troque_isso_por_uma_senha_segura"
FRONTEND_URL_DEV="http://localhost:3000"
FRONTEND_URL_PROD="https://confirma.ai"

GLOBAL_ADMIN_NOME="Admin Global"
GLOBAL_ADMIN_EMAIL="admin@confirma.ai"
GLOBAL_ADMIN_SENHA="adminpassword123"

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
TICKET_SECRET_KEY="troque_isso_por_um_segredo_forte"

EMAIL_HOST=""
EMAIL_PORT=""
EMAIL_USER=""
EMAIL_PASS=""
```

### Testes: `apps/api/.env.test`

O ambiente de teste usa a mesma base do `.env`, mas com valores próprios para não misturar dados reais:

```bash
NODE_ENV=test
DATABASE_NAME=confirma_ai_db_test
DATABASE_URL="mysql://root:root@localhost:3307/confirma_ai_db_test"
GLOBAL_ADMIN_NOME="Admin Test"
GLOBAL_ADMIN_EMAIL="admin-test@confirma.ai"
TICKET_SECRET_KEY="test_ticket_secret"
```

### Frontend: `apps/web/.env.local`

Configure a URL da API consumida pelo Next.js:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Seed e testes

O projeto já possui um seed para testes em `apps/api/prisma/seed.test.ts`. Ele prepara a base com os dados mínimos para a suíte de integração, então antes de rodar os testes a API executa o `prisma db push` e em seguida popula o banco com o seed específico de teste.

```bash
pnpm --filter api run test
```

## Roadmap

- [x] Multi-tenancy para múltiplas organizações
- [x] CRUD de eventos
- [x] Inscrições e tickets
- [ ] Dashboard do produtor no frontend
- [ ] Integração de pagamento completa com gateway
- [ ] Check-in por QR Code
- [ ] Gestão automática de lotes

## Documentação

Mais detalhes técnicos podem ser encontrados em [./docs](./docs).