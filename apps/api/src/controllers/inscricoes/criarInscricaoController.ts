import { RequestHandler } from "express";
import { prisma } from "../../config/database";
import { ConflitoException } from "../../exceptions";
import {
  CriarInscricaoParamsSchema,
  CriarInscricaoRequestSchema,
} from "../../schemas/inscricoes/criarInscricaoSchema";
import { verificarEventoExistente } from "../../services/eventoService";

import { gerarCredenciaisIncricao } from "../../services/credenciaisInscricoesService";

const criarInscricao: RequestHandler<
  CriarInscricaoParamsSchema,
  any,
  CriarInscricaoRequestSchema,
  any
> = async (req, res) => {
  const eventoId = String(req.params.id);
  const { nome, email, curso } = req.body;

  await verificarEventoExistente(eventoId, req.tenant!.id);

  const { hash, qrCode } = await gerarCredenciaisIncricao();

  const usuarioInscrito = await prisma.inscricoes.findFirst({
    where: {
      eventoId,
      tenantId: req.tenant!.id,
      email,
    },
  });

  if (usuarioInscrito) {
    throw new ConflitoException("Usuário já inscrito no evento");
  }

  // Criar a inscrição no banco de dados
  const novaInscricao = await prisma.inscricoes.create({
    data: {
      eventoId,
      tenantId: req.tenant!.id,
      qr_hash: hash,
      qr_code: qrCode,
      nome,
      email,
      curso,
    },
  });

  //retorna a inscrição criada
  return res.status(201).json({
    mensagem: "Inscrição realizada com sucesso!",
    inscricao: novaInscricao,
  });
};

export default criarInscricao;
