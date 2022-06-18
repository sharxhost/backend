import "dotenv/config";
import express, { Router } from "express";
import { Signale } from "signale";
import { PrismaClient } from "@prisma/client";
import { readdirSync } from "fs";

export let startTime: Date;

const signale = new Signale({
  scope: "main",
});

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

const prismaLogger = signale.scope("prisma");
prisma.$on("query", prismaLogger.debug);
prisma.$on("error", prismaLogger.fatal);
prisma.$on("info", prismaLogger.info);
prisma.$on("warn", prismaLogger.warn);

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const routes = readdirSync("./src/routes");
routes.forEach((route) => {
  if (route.endsWith(".ts")) {
    signale.info(`Loading router ${route}...`);
    // eslint-disable-next-line
    const routeModule: Router = require(`./routes/${route}`).default as Router;
    // eslint-disable-next-line
    const prefix: string | undefined = require(`./routes/${route}`).prefix;
    if (!routeModule) {
      signale.error(`Failed to load router ${route}!`);
      return;
    }
    if (prefix) app.use(prefix, routeModule);
    else app.use(routeModule);
  }
});

app.listen(port, () => {
  startTime = new Date();
  signale.success(`Listening on port ${port}`);
});

export { prisma };