import { Router } from "express";
import buscarDisponibilidade from "../controllers/cart/buscarDisponibilidadeController";
import {
  validarSchemaMiddleware,
  validarTokenMiddleware,
} from "../middlewares";
import { buscarDisponibilidadeSchema } from "../schemas/cart/buscarDisponibilidadeSchema";

const ticketsRoutes = Router({ mergeParams: true });

ticketsRoutes.get(
  "/:batchTicketId/availability",
  validarTokenMiddleware,
  validarSchemaMiddleware(buscarDisponibilidadeSchema.shape.params, "PARAMS"),
  buscarDisponibilidade,
);

export default ticketsRoutes;
