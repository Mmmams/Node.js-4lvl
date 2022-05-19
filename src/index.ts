import { createClient } from "redis";
import "reflect-metadata";
import { createConnection } from "typeorm";
import express, { Application } from "express";
import swaggerUi from "swagger-ui-express";

import router from "./routes/routes";
import dbConfig from "./config/database";
//@ts-ignore
import * as swaggerDoc from "./config/swagger.json";

const PORT = process.env.PORT || 8000;

const redisPort = 6379;
export const client = createClient({ url: `redis://redis:${redisPort}` });
client.connect();

client.on("error", (err: any) => {
  console.log(err);
});

const app: Application = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

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
