import { Router } from "express";
import buscarDisponibilidade from "../controllers/cart/buscarDisponibilidadeController";
import checkinTicket from "../controllers/tickets/checkinTicketController";
import listUserTickets from "../controllers/tickets/listUserTicketsController";
import {
  adminRouteMiddleware,
  validarSchemaMiddleware,
  validarTokenMiddleware,
} from "../middlewares";
import { buscarDisponibilidadeSchema } from "../schemas/cart/buscarDisponibilidadeSchema";
import checkinTicketSchema from "../schemas/tickets/checkinTicketSchema";
import listUserTicketsSchema from "../schemas/tickets/listUserTicketsSchema";

const ticketsRoutes = Router({ mergeParams: true });

ticketsRoutes.get(
  "/",
  validarTokenMiddleware,
  validarSchemaMiddleware(listUserTicketsSchema.shape.query, "QUERY"),
  listUserTickets,
);

ticketsRoutes.post(
  "/checkin/:hash",
  validarTokenMiddleware,
  adminRouteMiddleware,
  validarSchemaMiddleware(checkinTicketSchema.shape.params, "PARAMS"),
  checkinTicket,
);

ticketsRoutes.get(
  "/:batchTicketId/availability",
  validarTokenMiddleware,
  validarSchemaMiddleware(buscarDisponibilidadeSchema.shape.params, "PARAMS"),
  buscarDisponibilidade,
);

export default ticketsRoutes;
