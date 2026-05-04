import z from "zod";

const criarInscricaoSchema = z.object({
  params: z.object({
    tenantSlug: z.string().nonempty(),
    id: z.uuid(),
  }),
  request: z.object({
    nome: z.string().nonempty(),
    email: z.email(),
    curso: z.string().optional(),
  }),
});

export type CriarInscricaoParamsSchema = z.infer<
  typeof criarInscricaoSchema.shape.params
>;

export type CriarInscricaoRequestSchema = z.infer<
  typeof criarInscricaoSchema.shape.request
>;

export default criarInscricaoSchema;