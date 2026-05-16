import Decimal from "decimal.js";
import { RequestHandler } from "express";
import {
  DetalhesEventoParamsSchema,
  DetalhesEventoResponseSchema,
} from "../../schemas/eventos/detalhesEventoSchema";
import { buscarEventoDetalhado } from "../../services/eventoService";

const detalhesEvento: RequestHandler<
  DetalhesEventoParamsSchema,
  DetalhesEventoResponseSchema,
  any,
  any
> = async (req, res) => {
  const { id } = req.params;

  const evento = await buscarEventoDetalhado(id, req.tenant!.id);

  const formattedEvento = {
    ...evento,
    batches: evento.batches.map((batch) => ({
      ...batch,
      batchTickets: batch.batchTickets.map((ticket) => ({
        ...ticket,
        price: new Decimal(ticket.price).toDecimalPlaces(2).toNumber(),
      })),
    })),
  };

  return res.status(200).json(formattedEvento);
};

export default detalhesEvento;
