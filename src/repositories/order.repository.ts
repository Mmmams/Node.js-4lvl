import { Request, Response } from "express";
import { client } from "./../index";
import { Order } from "./../entities/order";
import { getRepository } from "typeorm";
import amqplib from "amqplib";
const amqp = require("amqplib/callback_api");

const amqp_url = process.env.CLOUDAMQP_URL || "amqp://localhost:5672";

const ORDER_QUEUE = "order";
const EXCHANGE = "test_exchange";
const ROUTE_KEY = "test_route";

export async function getOrders(req: Request, res: Response) {
  const searchTerm = req.query.search;
  try {
    client.get(searchTerm, async (err: any, orders: Order[]) => {
      if (err) throw err;
      const orderRepository = getRepository(Order);
      if (orders) {
        res.status(200).send({
          orders,
          message: "Orders from cache",
        });
      } else {
        const orders = await orderRepository.find();
        client.setex(searchTerm, 600, JSON.stringify(orders));
        res.status(200).send({
          orders,
          message: "cache miss",
        });
      }
    });
  } catch (err: any) {
    res.status(500).send({ message: err.message });
  }
}

export async function createOrder(req: Request, res: Response) {
  console.log("Publishing");
  console.log(amqp_url);
  const connection = await amqplib.connect(amqp_url, "heartbeat=60");
  const channel = await connection.createChannel();

  const msg = req.body;
  await channel
    .assertExchange(EXCHANGE, "direct", { durable: true })
    .catch(console.error);
  await channel.assertQueue(ORDER_QUEUE, { durable: true });
  await channel.bindQueue(ORDER_QUEUE, EXCHANGE, ROUTE_KEY);
  await channel.publish(EXCHANGE, ROUTE_KEY, Buffer.from(msg));
  setTimeout(function () {
    channel.close();
    connection.close();
  }, 500);
}

export async function addOrder() {
  const connection = await amqplib.connect(amqp_url, "heartbeat=60");
  const channel = await connection.createChannel();
  await connection.createChannel();
  await channel.assertQueue(ORDER_QUEUE, { durable: true });
  await channel.consume(
    ORDER_QUEUE,
    function (msg: any) {
      if (msg) {
        console.log(msg.content.toString());
        channel.ack(msg);
        channel.cancel("myconsumer");
      }
    },
    { consumerTag: "myconsumer" }
  );
  setTimeout(function () {
    channel.close();
    connection.close();
  }, 500);
}

export async function a() {
  // Step 1: Create Connection
  amqp.connect("amqp://localhost", (connError, connection) => {
    if (connError) {
      throw connError;
    }
    // Step 2: Create Channel
    connection.createChannel((channelError, channel) => {
      if (channelError) {
        throw channelError;
      }
      // Step 3: Assert Queue
      const QUEUE = "codingtest";
      channel.assertQueue(QUEUE);
      // Step 4: Send message to queue
      channel.sendToQueue(QUEUE, Buffer.from("hello from its coding time"));
      console.log(`Message send ${QUEUE}`);
    });
  });
}
