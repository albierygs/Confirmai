import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./constants";
import { prisma } from "./database";

const localDevFallbackStripeKey = "sk_test_local_placeholder";
const stripeSecret = STRIPE_SECRET_KEY?.trim();

if (!stripeSecret) {
  console.warn(
    "STRIPE_SECRET_KEY nao configurada. Usando chave local de fallback para inicializacao da API."
  );
}

export const stripe = new Stripe(stripeSecret || localDevFallbackStripeKey, {
  typescript: true,
});

export const getStripeGlobalConfig = async () =>
  prisma.paymentProvider.findUnique({
    where: {
      slug: "stripe",
    },
    include: {
      paymentMethods: true,
    },
  });
