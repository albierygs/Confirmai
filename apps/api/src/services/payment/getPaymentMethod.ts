import { prisma } from "../../config/database";
import { NaoEncontradoException } from "../../exceptions";

export const getPaymentMethod = async (
  providerId: string,
  methodSlug: string,
) => {
  const method = await prisma.paymentMethod.findFirst({
    where: {
      providerId,
      slug: methodSlug,
      isActive: true,
    },
    include: {
      provider: true,
    },
  });

  if (!method) {
    throw new NaoEncontradoException(
      `Método de pagamento '${methodSlug}' não encontrado ou inativo.`,
    );
  }

  return method;
};
