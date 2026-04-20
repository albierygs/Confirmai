import z from "zod";

export const onboardTenantSchema = z.object({
  response: z.object({
    url: z.url()
  })
})

export type OnboardStatusResponseSchema = z.infer<typeof onboardTenantSchema.shape.response>