import { prisma } from "../../config/database";
import { NaoEncontradoException } from "../../exceptions";

export const getPaymentProvider = async (slug: string) => {
  const provider = await prisma.paymentProvider.findUnique({
    where: { slug, isActive: true },
    include: {
      paymentMethods: {
        where: { isActive: true },
        orderBy: { slug: "asc" },
      },
    },
  });

  if (!provider) {
    throw new NaoEncontradoException(
      `Provider de pagamento '${slug}' não encontrado ou inativo.`,
    );
  }

  return provider;
};
