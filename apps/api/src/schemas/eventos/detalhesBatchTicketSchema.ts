import z from "zod";
import batchTicketSchema from "./batchTicketSchema.js";
import ticketTypeSchema from "./ticketTypeSchema.js";

const detalhesBatchTicketSchema = z.object({
  params: z.object({
    eventoId: z.uuid("O ID do evento deve ser um UUID válido."),
    batchId: z.uuid("O ID do lote deve ser um UUID válido."),
    batchTicketId: z.uuid("O ID do ticket no lote deve ser um UUID válido."),
  }),
  response: batchTicketSchema.extend({
    ticketType: ticketTypeSchema,
  }),
});

export type DetalhesBatchTicketParamsSchema = z.infer<
  typeof detalhesBatchTicketSchema.shape.params
>;
export type DetalhesBatchTicketResponseSchema = z.infer<
  typeof detalhesBatchTicketSchema.shape.response
>;

export default detalhesBatchTicketSchema;
