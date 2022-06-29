import { Router } from "express";
import { prisma } from "../index";
import { createSignale } from "../utils";
import jwt from "jsonwebtoken";
import { authenticateJWT } from "./authRouter";
import { User } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

router.post("/createKey", authenticateJWT, async (req, res) => {
  try {
    const key = jwt.sign({ user: res.locals.user as string, ip: req.ip, type: "upload" }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

    await prisma.uploadKey.create({
      data: {
        userId: res.locals.user as string,
        key: key,
      },
    });

    res.json({
      success: true,
      key: key,
    });
  }
  catch (err) {
    res.json({
      success: false,
      error: err,
    });
  }
});

router.get("/uploadKeys", authenticateJWT, async (req, res) => {
  try {
    const keyObjects = await prisma.uploadKey.findMany({
      where: {
        userId: res.locals.user as string,
      },
    });

    const keys: string[] = [];
    for (const keyObject of keyObjects) {
      keys.push(keyObject.key);
    }

    res.json({
      success: true,
      keys: keys,
    });
  }
  catch (err) {
    res.json({
      success: false,
      error: err,
    });
  }
});

router.get("/info", authenticateJWT, (req, res) => {
  const user = res.locals.userObj as User;
  res.json({
    success: true,
    uuid: res.locals.user as string,
    username: user.username,
    email: user.email,
    createdAt: user.created.getTime(),
  });
});

export const prefix = "/user";
export default router;