import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../src/config/database";

async function seedTestDatabase() {
  // Keep the seed deterministic and isolated for integration tests.
  await prisma.inscricoes.deleteMany();
  await prisma.eventos.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.tenants.deleteMany();

  const randomSuffix = crypto.randomBytes(3).toString("hex");

  const tenant = await prisma.tenants.create({
    data: {
      nome: "Tenant Seed Teste",
      slug: `tenant-seed-${randomSuffix}`,
      cnpj: gerarCNPJ(),
      email: `tenant-seed-${randomSuffix}@teste.com`,
      telefone: "11999999999",
      status: "ativo",
    },
  });

  const senhaHash = await bcryptjs.hash("senha-teste", 10);

  await prisma.usuarios.createMany({
    data: [
      {
        nome: "Admin Seed",
        email: `admin-seed-${randomSuffix}@teste.com`,
        cargo: "admin",
        senhaHash,
        tenantId: tenant.id,
      },
      {
        nome: "Global Admin Seed",
        email: `global-admin-seed-${randomSuffix}@teste.com`,
        cargo: "global_admin",
        senhaHash,
        tenantId: tenant.id,
      },
    ],
  });

  await prisma.eventos.create({
    data: {
      tenantId: tenant.id,
      titulo: "Evento Seed Teste",
      linkSlug: `evento-seed-${randomSuffix}`,
      descricao: "Evento base para testes de integracao",
      status: "ativo",
      closingDate: new Date(Date.now() + 7 * 86400000),
    },
  });
}

function gerarCNPJ(): string {
  let result = "";
  for (let i = 0; i < 14; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

seedTestDatabase()
  .then(() => {
    console.log("[seed.test] Banco de testes preparado com sucesso.");
  })
  .catch((error) => {
    console.error("[seed.test] Falha ao preparar banco de testes:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
