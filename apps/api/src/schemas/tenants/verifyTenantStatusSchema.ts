import z from "zod";

export const verifyTenantStatusSchema = z.object({
  response: z.object({
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
    detailsSubmitted: z.boolean(),
    accountStatus: z.enum(["PENDING", "ENABLED", "DISABLED", "RESTRICTED"])
  })
})

export type VerifyTenantStatusResponseSchema = z.infer<typeof verifyTenantStatusSchema.shape.response>