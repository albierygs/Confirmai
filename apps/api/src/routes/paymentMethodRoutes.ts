import { Router } from "express";
import { calculatePaymentFees } from "../controllers/paymentMethod/calculatePaymentFeesController";
import listPaymentMethods from "../controllers/paymentMethod/listPaymentMethodsController";

const paymentMethodsRoutes = Router();

paymentMethodsRoutes.get("/", listPaymentMethods);
paymentMethodsRoutes.post("/calculate", calculatePaymentFees);

export default paymentMethodsRoutes;
