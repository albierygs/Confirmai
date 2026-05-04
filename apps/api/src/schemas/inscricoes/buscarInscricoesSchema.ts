import z from "zod";

const buscarInscricoesSchema = z.object({
  params: z.object({
    tenantSlug: z.string().nonempty(),
    id: z.uuid(),
  }),
});

export default buscarInscricoesSchema;