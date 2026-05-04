import z from "zod";
import planSchema from "./planSchema";

const listarPlanosSchema = z.object({
  response: z
    .object({
      planos: z.array(planSchema).openapi({
        description: "Lista de planos disponíveis",
      }),
    })
    .strict(),
});

export type ListarPlanosResponseSchema = z.infer<
  typeof listarPlanosSchema.shape.response
>;

export default listarPlanosSchema;
