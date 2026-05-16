import { RequestHandler } from "express";
import { OnboardStatusResponseSchema } from "../../schemas/tenants/onboardTenantSchema";
import { createConnectAccountAndLink } from "../../services/stripe/createConnectAccountAndLink";

export const onboardTenant: RequestHandler<any, OnboardStatusResponseSchema> = async (req, res) => {
  const tenantId = req.tenant!.id; 

  const { url } = await createConnectAccountAndLink(tenantId);

  return res.status(200).json({ url });
};