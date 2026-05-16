import { RequestHandler } from "express";
import { VerifyTenantStatusResponseSchema } from "../../schemas/tenants/verifyTenantStatusSchema";
import { syncConnectAccountStatus } from "../../services/stripe/syncConnectAccountStatus";

export const verifyTenantStatus: RequestHandler<
  any,
  VerifyTenantStatusResponseSchema
> = async (req, res) => {
  const tenantId = req.tenant!.id;

  // Sincroniza e pega o status atualizado
  const accountStatus = await syncConnectAccountStatus(tenantId, undefined);

  return res.status(200).json({
    chargesEnabled: accountStatus.chargesEnabled,
    payoutsEnabled: accountStatus.payoutsEnabled,
    detailsSubmitted: accountStatus.detailsSubmitted,
    accountStatus: accountStatus.accountStatus,
  });
};
