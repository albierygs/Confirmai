import { z } from "zod";

const checkinTicketSchema = z.object({
  params: z.object({
    hash: z
      .string()
      .min(1, "O hash do ticket é obrigatório")
      .openapi({
        description: "Hash único do ticket (QR Code)",
        example: "a1b2c3d4e5f6",
      }),
  }),

  response: z.object({
    success: z.boolean().openapi({
      description: "Se o check-in foi realizado com sucesso",
      example: true,
    }),
    ticket: z.object({
      id: z.uuid().openapi({ description: "ID do ticket" }),
      hash: z.string().openapi({ description: "Hash do ticket" }),
      status: z.string().openapi({ description: "Status do ticket" }),
      eventName: z.string().openapi({
        description: "Nome do evento",
        example: "Show de Música",
      }),
      ticketType: z.string().openapi({
        description: "Tipo do ingresso",
        example: "Inteira",
      }),
      batchName: z.string().openapi({
        description: "Nome do lote",
        example: "1° Lote",
      }),
      ownerName: z.string().openapi({
        description: "Nome do dono do ingresso",
        example: "João Silva",
      }),
      checkedInAt: z.date().openapi({
        description: "Data e hora do check-in",
      }),
    }),
  }),
});

export type CheckinTicketParamsSchema = z.infer<
  typeof checkinTicketSchema.shape.params
>;

export type CheckinTicketResponseSchema = z.infer<
  typeof checkinTicketSchema.shape.response
>;

export default checkinTicketSchema;
