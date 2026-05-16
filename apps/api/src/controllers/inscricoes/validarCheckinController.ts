import { RequestHandler } from "express"; 
import { prisma } from "../../config/database";

const validarCheckin: RequestHandler = async (req, res) => {

  const { hash } = req.body;

  const inscricao = await prisma.inscricoes.findFirst({
    where: {
      qr_hash: hash,
      tenantId: req.tenant!.id,
    },
  });

  if (!inscricao) {
    return res.status(404).json({ valido: false, message: "QR Code inválido" });
  }

  const evento = await prisma.eventos.findFirst({
    where: {
      id: inscricao.eventoId,
      tenantId: req.tenant!.id,
    },
  });

  return res.status(200).json({
    valido: true,
    participante: {
      inscricaoId: inscricao.id,
      nome: inscricao.nome,
      email: inscricao.email,
      evento: evento?.titulo ?? "",
      tenant: req.tenant!.nome,
      checkinRealizado: inscricao.checkin_realizado,
    },
  });
};

export default validarCheckin;