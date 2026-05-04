
import { extrairTenantSlugDoHost } from "./src/services/tenantService";
import { prisma } from "./src/config/database";

async function run() {
  const slug = "tenant-teste";
  const host = "tenant-teste.lvh.me";

  console.log(`Creating/Finding tenant with slug: ${slug}`);
  const tenant = await prisma.tenants.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      nome: "Tenant Teste",
      cnpj: "00000000000000",
      telefone: "0000000000",
      email: "teste@teste.com",
    },
  });
  console.log(`Tenant created/found: ID ${tenant.id}, Slug ${tenant.slug}`);

  const extracted = extrairTenantSlugDoHost(host);
  console.log(`Extracted slug from host "${host}": ${extracted}`);

  if (extracted) {
    const found = await prisma.tenants.findUnique({
      where: { slug: extracted },
    });
    console.log(`FindUnique result: ID ${found?.id}, Slug ${found?.slug}`);
  } else {
    console.log("No slug extracted.");
  }

  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});

