import z from "zod";
import planSchema from "./planSchema";

const subscriptionSchema = z
  .object({
    id: z.uuid().openapi({ description: "ID (UUID) da assinatura" }),
    tenantId: z.uuid().openapi({ description: "ID do tenant" }),
    planId: z.uuid().openapi({ description: "ID do plano" }),
    status: z
      .enum(["ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"])
      .openapi({
        description: "Status da assinatura",
        example: "ACTIVE",
      }),
    startDate: z.date().openapi({ description: "Data de início" }),
    endDate: z.date().openapi({ description: "Data de término" }),
    canceledAt: z.date().nullable().openapi({
      description: "Data de cancelamento",
    }),
    cancelAtEnd: z.boolean().openapi({
      description: "Se a assinatura será cancelada ao final do período",
      example: false,
    }),
    createdAt: z.date().openapi({ description: "Data de criação" }),
    updatedAt: z.date().openapi({ description: "Data de atualização" }),
    plan: planSchema.openapi({ description: "Dados do plano" }),
  })
  .strict();

export type SubscriptionSchema = z.infer<typeof subscriptionSchema>;

export default subscriptionSchema;
