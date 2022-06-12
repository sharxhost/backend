import signale from "signale";
import { Router } from "express";
import { prisma } from "../index";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export default router;