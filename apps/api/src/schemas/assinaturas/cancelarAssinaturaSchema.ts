import z from "zod";
import subscriptionSchema from "./subscriptionSchema";

const cancelarAssinaturaSchema = z.object({
  response: z
    .object({
      mensagem: z.string().openapi({
        description: "Mensagem de sucesso",
        example:
          "Assinatura será cancelada ao final do período",
      }),
      assinatura: subscriptionSchema.openapi({
        description: "Dados da assinatura cancelada",
      }),
    })
    .strict(),
});

export type CancelarAssinaturaResponseSchema = z.infer<
  typeof cancelarAssinaturaSchema.shape.response
>;

export default cancelarAssinaturaSchema;
