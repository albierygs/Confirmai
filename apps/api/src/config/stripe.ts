import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./constants";
import { prisma } from "./database";

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
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
