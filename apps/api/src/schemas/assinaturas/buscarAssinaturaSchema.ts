import z from "zod";
import subscriptionSchema from "./subscriptionSchema";

const buscarAssinaturaSchema = z.object({
  response: z
    .object({
      assinatura: subscriptionSchema.nullable().openapi({
        description: "Assinatura atual do tenant (ou null se não tiver)",
      }),
    })
    .strict(),
});

export type BuscarAssinaturaResponseSchema = z.infer<
  typeof buscarAssinaturaSchema.shape.response
>;

export default buscarAssinaturaSchema;
