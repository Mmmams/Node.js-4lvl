import * as express from "express";
import {
  createOrder,
  doOrder,
  getOrders,
} from "../repositories/order.repository";

const router = express.Router();

router.get("/orders/do", async function (req, res) {
  return await doOrder(req, res);
});

router.post("/orders/create", async function (req, res) {
  return createOrder(req, res);
});

router.get("/orders/all", async function (req, res) {
  return await getOrders(req, res);
});

export default router;
