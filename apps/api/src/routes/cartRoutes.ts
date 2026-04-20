import { Router } from "express";
import adicionarAoCarrinho from "../controllers/cart/adicionarAoCarrinhoControllerr";
import buscarCarrinho from "../controllers/cart/buscarCarrinhoController";
import limparCarrinho from "../controllers/cart/limparCarrinhoController";
import removerDoCarrinho from "../controllers/cart/removerDoCarrinhoController";
import {
  validarSchemaMiddleware,
  validarTokenMiddleware,
} from "../middlewares";
import { adicionarAoCarrinhoSchema } from "../schemas/cart/adicionarAoCarrinhoSchema";
import { removerDoCarrinhoSchema } from "../schemas/cart/removerDoCarrinhoSchema";

const cartRoutes = Router({ mergeParams: true });

cartRoutes.post(
  "/items",
  validarTokenMiddleware,
  validarSchemaMiddleware(
    adicionarAoCarrinhoSchema.shape.request,
    "REQUEST_BODY",
  ),
  adicionarAoCarrinho,
);

cartRoutes.delete(
  "/remove",
  validarTokenMiddleware,
  validarSchemaMiddleware(
    removerDoCarrinhoSchema.shape.request,
    "REQUEST_BODY",
  ),
  removerDoCarrinho,
);

cartRoutes.get("/", validarTokenMiddleware, buscarCarrinho);

cartRoutes.delete("/clear", validarTokenMiddleware, limparCarrinho);

export default cartRoutes;
