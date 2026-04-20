import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import { AppException, NaoEncontradoException } from "../../exceptions";

export const syncConnectAccountStatus = async (
  tenantId?: string,
  accountId?: string,
) => {
  if (!tenantId && !accountId) {
    throw new AppException(
      "É necessário fornecer tenantId ou accountId para sincronizar o status da conta Stripe.",
      400,
      "MissingIdentifier",
    );
  }

  const whreClause: Prisma.StripeAccountWhereUniqueInput = tenantId
    ? { tenantId }
    : { accountId: accountId! };
  const stripeAccountDB = await prisma.stripeAccount.findUnique({
    where: whreClause,
  });

  if (!stripeAccountDB)
    throw new NaoEncontradoException("Conta Stripe não encontrada no banco.");

  // Busca os dados atualizados direto do Stripe
  const account = await stripe.accounts.retrieve(stripeAccountDB.accountId);

  // Atualiza seu banco de dados com os status reais
  const updatedAccount = await prisma.stripeAccount.update({
    where: { accountId: account.id },
    data: {
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      capabilitiesData: account.capabilities as any,
      requirementsData: account.requirements as any,
      lastSyncAt: new Date(),
      accountStatus: account.charges_enabled ? "ENABLED" : "PENDING",
    },
  });

  return updatedAccount;
};
