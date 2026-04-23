import { RequestHandler } from "express";
import { handleStripeWebhook } from "../../services/stripe/handleWebhook";

const handleWebhook: RequestHandler = async (req, res) => {
  await handleStripeWebhook(req);
  return res.json({ received: true });
};

export default handleWebhook;
