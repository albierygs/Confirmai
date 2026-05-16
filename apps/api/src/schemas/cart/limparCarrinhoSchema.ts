import z from "zod";

export const limparCarrinhoSchema = z.object({
  response: z.object({
    success: z.boolean().openapi({
      description: "Se o cancelamento foi feito com sucesso",
      example: true,
    }),
    cleared: z
      .int()
      .openapi({ description: "Número de reservas apagadas", example: 4 }),
  }),
});

export type LimparCarrinhoResponseSchema = z.infer<
  typeof limparCarrinhoSchema.shape.response
>;
