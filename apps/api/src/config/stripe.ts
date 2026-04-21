import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./constants";
import { prisma } from "./database";

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  typescript: true,
});

export const stripeGlobalConfig = await prisma.paymentProvider.findUnique({
  where: {
    slug: "stripe",
  },
  include: {
    paymentMethods: true,
  },
});
