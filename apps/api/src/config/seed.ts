import bcryptjs from "bcryptjs";
import Decimal from "decimal.js";
import {
  GLOBAL_ADMIN_EMAIL,
  GLOBAL_ADMIN_NOME,
  GLOBAL_ADMIN_SENHA,
} from "./constants";
import { prisma } from "./database";

const ticketTypes = [
  {
    name: "Inteira",
    description: "Ingresso valor integral",
  },
  {
    name: "Meia Entrada",
    description:
      "Estudantes, idosos, PCD (conforme lei 12.933/2013). Apresentar documento comprobatório na entrada.",
  },
  {
    name: "VIP",
    description: "Acesso a áreas exclusivas",
  },
  {
    name: "Camarote",
    description: "Área premium com serviços diferenciados",
  },
  {
    name: "Pista",
    description: "Área comum do evento",
  },
  {
    name: "Backstage",
    description: "Acesso aos bastidores",
  },
  {
    name: "Cortesia",
    description: "Ingresso gratuito",
  },
];

// Métodos de pagamento do Stripe com taxas reais
const stripeMethods = [
  {
    slug: "credit_card",
    name: "Cartão de Crédito",
    // Taxas Stripe Brasil: 3.99% + R$ 0,39
    gatewayFeePercent: new Decimal(3.99),
    gatewayFeeFixed: new Decimal(0.39),
    allowInstallments: true,
    maxInstallments: 3,
    minInstallmentValue: new Decimal(100),
    interestFree: 1, // 1x sem juros
    interestRate: new Decimal(2.99), // 2.99% a.m. após parcelas sem juros
    isActive: true,
  },
  {
    slug: "debit_card",
    name: "Cartão de Débito",
    // Taxas Stripe Brasil débito: 3.99% + R$ 0,39
    gatewayFeePercent: new Decimal(3.99),
    gatewayFeeFixed: new Decimal(0.39),
    allowInstallments: false,
    maxInstallments: 1,
    minInstallmentValue: new Decimal(0),
    interestFree: 1,
    interestRate: new Decimal(0),
    isActive: true,
  },
  {
    slug: "pix",
    name: "PIX",
    // Taxas Stripe PIX: 1.19% (sem taxa fixa)
    gatewayFeePercent: new Decimal(1.19),
    gatewayFeeFixed: new Decimal(0),
    allowInstallments: false,
    maxInstallments: 1,
    minInstallmentValue: new Decimal(0),
    interestFree: 1,
    interestRate: new Decimal(0),
    isActive: true,
  },
  {
    slug: "boleto",
    name: "Boleto Bancário",
    // Taxas Stripe Boleto: R$ 3,45 fixo
    gatewayFeePercent: new Decimal(0),
    gatewayFeeFixed: new Decimal(3.45),
    allowInstallments: false,
    maxInstallments: 1,
    minInstallmentValue: new Decimal(0),
    interestFree: 1,
    interestRate: new Decimal(0),
    isActive: false, // Desabilitado por padrão (prazo de pagamento)
  },
];

const seed = async () => {
  // Seed admin
  const adminExistente = await prisma.usuarios.findFirst({
    where: {
      email: GLOBAL_ADMIN_EMAIL,
    },
  });

  if (!adminExistente) {
    const senhaHash = await bcryptjs.hash(GLOBAL_ADMIN_SENHA, 10);

    await prisma.usuarios.create({
      data: {
        nome: GLOBAL_ADMIN_NOME,
        email: GLOBAL_ADMIN_EMAIL,
        senhaHash,
        cargo: "global_admin",
      },
    });

    console.info("Global admin criado");
  }

  // Seed ticket types
  for (const type of ticketTypes) {
    const exists = await prisma.ticketType.findFirst({
      where: { name: type.name },
    });

    if (!exists) {
      await prisma.ticketType.create({
        data: type,
      });
      console.info(`TicketType ${type.name} criado`);
    }
  }

  await seedStripePayment();
};

const seedStripePayment = async () => {
  console.log("💳 Seeding Stripe payment provider...");

  // Criar/atualizar provider Stripe
  const stripeProvider = await prisma.paymentProvider.upsert({
    where: { slug: "stripe" },
    update: {
      isActive: true,
      platformFeePercent: new Decimal(10), // 10% de comissão da plataforma
    },
    create: {
      slug: "stripe",
      isActive: true,
      platformFeePercent: new Decimal(10),
    },
  });

  console.log("✅ Stripe provider created/updated");

  for (const method of stripeMethods) {
    await prisma.paymentMethod.upsert({
      where: {
        providerId_slug: {
          providerId: stripeProvider.id,
          slug: method.slug,
        },
      },
      update: method,
      create: {
        ...method,
        providerId: stripeProvider.id,
      },
    });
  }

  console.log(
    `✅ ${stripeMethods.length} Stripe payment methods created/updated`,
  );
};

if (process.argv[1] === import.meta.filename) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

export default seed;
