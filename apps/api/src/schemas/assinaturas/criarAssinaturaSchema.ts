import z from "zod";

const criarAssinaturaSchema = z.object({
  request: z
    .object({
      planId: z
        .uuid("O campo 'planId' deve ser um UUID válido")
        .nonoptional("O campo 'planId' é obrigatório")
        .openapi({
          description: "ID do plano a ser contratado",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
    })
    .strict(),
  response: z
    .object({
      mensagem: z.string().openapi({
        description: "Mensagem de sucesso",
        example: "Redirecionando para o checkout",
      }),
      checkoutUrl: z.string().openapi({
        description: "URL de checkout do Stripe para pagamento da assinatura",
        example: "https://checkout.stripe.com/c/pay/cs_test_xxx",
      }),
      checkoutSessionId: z.string().openapi({
        description: "ID da sessão de checkout do Stripe",
        example: "cs_test_xxx",
      }),
    })
    .strict(),
});

export type CriarAssinaturaRequestSchema = z.infer<
  typeof criarAssinaturaSchema.shape.request
>;

export type CriarAssinaturaResponseSchema = z.infer<
  typeof criarAssinaturaSchema.shape.response
>;

export default criarAssinaturaSchema;
