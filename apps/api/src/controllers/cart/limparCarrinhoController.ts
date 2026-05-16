import { RequestHandler } from "express";
import { LimparCarrinhoResponseSchema } from "../../schemas/cart/limparCarrinhoSchema";
import { cancelAllReservations } from "../../services/reservaService";

/**
 * DELETE /:tenantSlug/cart/clear
 */
const limparCarrinho: RequestHandler<
  any,
  LimparCarrinhoResponseSchema
> = async (req, res) => {
  const cleared = await cancelAllReservations(req.user!.id, req.tenant!.id);

  return res.status(200).json({
    success: true,
    cleared,
  });
};

export default limparCarrinho;
