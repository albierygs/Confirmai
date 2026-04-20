import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { stripe } from "../../config/stripe";
import { NaoEncontradoException } from "../../exceptions";

export const createLoginLink: RequestHandler<
  any,
  { loginUrl: string }
> = async (req, res) => {
  const tenantId = req.tenant!.id;

  const account = await prisma.stripeAccount.findUnique({
    where: {
      tenantId,
    },
    select: {
      accountId: true,
    },
  });

  if (!account) {
    throw new NaoEncontradoException(
      "Conta Stripe não encontrada para este tenant.",
    );
  }

  // Cria o login link usando a API do Stripe
  const accountLink = await stripe.accounts.createLoginLink(account.accountId);

  return res.status(200).json({ loginUrl: accountLink.url });
};
