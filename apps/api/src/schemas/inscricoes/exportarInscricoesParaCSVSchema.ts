import z from "zod";

const exportarInscricoesParaCSVSchema = z.object({
  params: z.object({
    tenantSlug: z.string().nonempty(),
    id: z.uuid(),
  }),
});

export default exportarInscricoesParaCSVSchema;