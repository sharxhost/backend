import "dotenv/config";
import express, { Router } from "express";
import signale from "signale";
import { PrismaClient } from "@prisma/client";
import { readdirSync } from "fs";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});
prisma.$on("query", signale.debug);
prisma.$on("error", signale.fatal);
prisma.$on("info", signale.info);
prisma.$on("warn", signale.warn);

export { prisma };

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const routes = readdirSync("./src/routes");
routes.forEach((route) => {
  if (route.endsWith(".ts")) {
    signale.info(`Loading router ${route}...`);
    // eslint-disable-next-line
    const routeModule: Router = require(`./routes/${route}`).default as Router;
    app.use(routeModule);
    signale.success(`Router ${route} loaded`);
  }
});

app.listen(port, () => signale.success(`Listening on port ${port}`));