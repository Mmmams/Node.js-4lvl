import * as express from "express";
import { a, createOrder, getOrders } from "../repositories/order.repository";

const router = express.Router();

router.get("/orders/add", function (req, res) {
  console.log("orders");
  res.send("Wiki home page");
});

router.post("/orders/create", async function (req, res) {
  return await createOrder(req, res);
});

router.post("/orders/createe", async function (req, res) {
  return await a();
});

router.get("/orders/all", async function (req, res) {
  return await getOrders(req, res);
});

export default router;
