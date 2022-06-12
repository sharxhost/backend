import Signale from "signale";
import { Router } from "express";
import { prisma } from "../index";
import { basename } from "path";

const signale = Signale.scope(basename(__filename));
signale.success("Registered!");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hello World!",
  });
});

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json({
    success: true,
    users: users,
  });
});

export default router;