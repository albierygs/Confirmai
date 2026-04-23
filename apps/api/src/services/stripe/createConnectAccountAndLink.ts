import { FRONTEND_URL } from "../../config/constants";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import { NaoEncontradoException } from "../../exceptions";
import { generateFrontUrlWithSlug } from "../../utils/generators";

export const createConnectAccountAndLink = async (tenantId: string) => {
  const tenant = await prisma.tenants.findUnique({
    where: { id: tenantId },
    include: { stripeAccount: true },
  });

  if (!tenant) throw new NaoEncontradoException("Tenant não encontrado.");

  let accountId = tenant.stripeAccount?.accountId;

  // Se o Tenant ainda não tem uma conta no Stripe, cria uma
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email: tenant.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: tenant.nome,
        url: tenant.site || undefined,
      },
    });

    accountId = account.id;

    // Salva no banco vinculando ao Tenant
    await prisma.stripeAccount.create({
      data: {
        tenantId,
        accountId,
        email: tenant.email,
        country: "BR",
        currency: "brl",
      },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${generateFrontUrlWithSlug(tenant.slug, `${FRONTEND_URL}/dashboard`)}`, // Se o link expirar
    return_url: `${generateFrontUrlWithSlug(tenant.slug, `${FRONTEND_URL}/dashboard`)}`, // Quando ele terminar
    type: "account_onboarding",
  });

  return { url: accountLink.url };
};
