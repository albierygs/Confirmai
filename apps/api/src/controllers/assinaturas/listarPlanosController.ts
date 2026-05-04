import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { ListarPlanosResponseSchema } from "../../schemas/assinaturas/listarPlanosSchema";

const listarPlanos: RequestHandler<any, ListarPlanosResponseSchema> = async (
  _req,
  res,
) => {
  const planos = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });

  // Converter Decimal para number para serialização
  const planosFormatados = planos.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  res.json({ planos: planosFormatados });
};

export default listarPlanos;
