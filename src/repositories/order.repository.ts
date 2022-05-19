import { Request, Response } from "express";
import { client } from "./../index";
import { Order } from "./../entities/order";
import { getRepository } from "typeorm";
import amqplib from "amqplib";

const amqp_url = process.env.CLOUDAMQP_URL || "amqp://rabbitmq";

const ORDER_QUEUE = "order";
const EXCHANGE = "test_exchange";
const ROUTE_KEY = "test_route";
const REDIS_KEY = "order_key10";

export async function getOrders(req: Request, res: Response) {
  const orders = await client.get(REDIS_KEY);
  const resp = orders && JSON.parse(orders);
  return res.status(200).send({
    orders: resp,
  });
}

export async function createOrder(req: Request, res: Response) {
  const connection = await amqplib.connect(amqp_url, "heartbeat=60");
  const channel = await connection.createChannel();
  const msg = req.body;
  await channel
    .assertExchange(EXCHANGE, "direct", { durable: true })
    .catch(console.error);
  await channel.assertQueue(ORDER_QUEUE, { durable: true });
  await channel.bindQueue(ORDER_QUEUE, EXCHANGE, ROUTE_KEY);
  await channel.publish(EXCHANGE, ROUTE_KEY, Buffer.from(JSON.stringify(msg)));
  setTimeout(function () {
    channel.close();
    connection.close();
  }, 500);
  return res.status(201).send({
    message: "Created",
  });
}

export async function doOrder(req, res) {
  const orderRepository = getRepository(Order);
  const connection = await amqplib.connect(amqp_url, "heartbeat=60");
  const channel = await connection.createChannel();
  await connection.createChannel();
  await channel.assertQueue(ORDER_QUEUE, { durable: true });
  await channel.consume(ORDER_QUEUE, async function (msg: any) {
    if (msg) {
      const order: Order = await orderRepository.save(JSON.parse(msg.content));
      const orders = await client.get(REDIS_KEY);
      if (!orders) {
        const ordersObj = new Object();
        ordersObj[order.id] = order;
        await client.set(REDIS_KEY, JSON.stringify(ordersObj));
      } else {
        const parsedOrders = orders && JSON.parse(orders);
        parsedOrders[order.id] = order;
        await client.set(REDIS_KEY, JSON.stringify(parsedOrders));
      }

      channel.ack(msg);
      channel.cancel("myconsumer");
      return res.status(200).send({
        message: "Order have done",
        order,
      });
    } else {
      return res.status(200).send({
        message: "There are no orders in queue",
      });
    }
  });
  setTimeout(function () {
    channel.close();
    connection.close();
  }, 500);
}

export async function createNewOrder(req: Request, res: Response) {
  const orderRepository = getRepository(Order);
  const order = {
    name: "random",
    price: 1000,
  };
  const newOrder = await orderRepository.save(order);
  console.log(newOrder);
}
