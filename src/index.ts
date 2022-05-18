const redis = require("redis");
import "reflect-metadata";
import { createConnection } from "typeorm";
import express, { Application } from "express";
import swaggerUi from "swagger-ui-express";

import router from "./routes/routes";
import dbConfig from "./config/database";

const PORT = process.env.PORT || 8000;

const redisPort = 6379;
export const client = redis.createClient(redisPort);

client.on("error", (err: any) => {
  console.log(err);
});

const app: Application = express();

app.use(express.json());
app.use(express.static("public"));

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: "/swagger.json",
    },
  })
);

app.use(router);

createConnection(dbConfig)
  .then((_connection) => {
    app.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });
  })
  .catch((err) => {
    console.log("Unable to connect to db", err);
    process.exit(1);
  });
