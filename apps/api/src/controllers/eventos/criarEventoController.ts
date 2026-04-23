import { RequestHandler } from "express";
import { prisma } from "../../config/database.js";
import { AppException } from "../../exceptions/AppException.ts";
import type {
  CriarEventoRequestSchema,
  CriarEventoResponseSchema,
} from "../../schemas/eventos/criarEventoSchema.ts";
import { generateSlug } from "../../services/eventoService.ts";

const criarEvento: RequestHandler<
  any,
  CriarEventoResponseSchema,
  CriarEventoRequestSchema,
  any
> = async (req, res) => {
  const { titulo, descricao, location, closingDate, startDate } = req.body;

  const tenant = await prisma.tenants.findUnique({
    where: {
      id: req.tenant!.id,
    },
    include: {
      stripeAccount: true,
    },
  });

  if (
    !tenant ||
    !tenant.stripeAccount ||
    !tenant.stripeAccount.chargesEnabled
  ) {
    throw new AppException(
      "Não é possível criar eventos sem a conta stripe estar configurada e com pagamentos habilitados.",
      400,
      "STRIPE_NOT_CONFIGURED",
    );
  }
  const evento = await prisma.eventos.create({
    data: {
      titulo,
      descricao,
      location,
      tenantId: req.tenant!.id,
      closingDate: new Date(closingDate),
      startDate: new Date(startDate),
      linkSlug: generateSlug(titulo),
    },
  });

  return res.status(201).json({
    mensagem: "Evento criado com sucesso!",
    evento,
    linkPublico: `/eventos/${evento.linkSlug}`,
  });
};

export default criarEvento;
