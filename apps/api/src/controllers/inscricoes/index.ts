import type { RequestHandler } from "express";
import { prisma } from "../../config/database";
import criarInscricaoController from "./criarInscricaoController";
import confirmarCheckin from "./confirmarCheckinController";
import validarCheckin from "./validarCheckinController";

export { criarInscricaoController as criarInscricao, confirmarCheckin, validarCheckin };

export const buscarInscricoes: RequestHandler = async (req, res) => {
  const eventoId = String(req.params.id);
  const tenantId = String(req.tenant!.id);

  const evento = await prisma.eventos.findFirst({
    where: {
      id: eventoId,
      tenantId,
    },
  });

  const inscricoes = await prisma.inscricoes.findMany({
    where: {
      eventoId,
      tenantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({
    evento,
    inscricoes,
  });
};

export const exportarInscricoesParaCSV: RequestHandler = async (req, res) => {
  const eventoId = String(req.params.id);
  const tenantId = String(req.tenant!.id);

  const inscricoes = await prisma.inscricoes.findMany({
    where: {
      eventoId,
      tenantId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      nome: true,
      email: true,
      curso: true,
      status: true,
      createdAt: true,
    },
  });

  const columns = ["id", "nome", "email", "curso", "status", "createdAt"];
  const rows = inscricoes.map((inscricao) =>
    columns
      .map((column) => {
        const value = inscricao[column as keyof typeof inscricao];
        const normalized = value instanceof Date ? value.toISOString() : String(value ?? "");
        return `"${normalized.replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="inscricoes-${eventoId}.csv"`);

  return res.status(200).send([columns.map((column) => `"${column}"`).join(","), ...rows].join("\n"));
};