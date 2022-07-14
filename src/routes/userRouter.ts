import { Router } from "express";
import { prisma } from "../index";
import { createSignale, wrapper } from "../utils";
import jwt from "jsonwebtoken";
import { authenticateJWT } from "./authRouter";
import { User } from "@prisma/client";
import { randomBytes } from "crypto";
import { ResourceNotFoundError } from "../errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

router.post("/uploadKey", authenticateJWT, (req, res) => {
  wrapper(res, async () => {
    const key = jwt.sign({ user: res.locals.user as string, ip: req.ip, type: "upload", rnd: randomBytes(8).toString("hex") }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

    await prisma.uploadKey.create({
      data: {
        userId: res.locals.user as string,
        key: key,
      },
    });

    return { key: key };
  });
});

router.get("/uploadKey", authenticateJWT, (req, res) => {
  wrapper(res, async () => {
    const keyObjects = await prisma.uploadKey.findMany({
      where: {
        userId: res.locals.user as string,
      },
    });

    const keys: string[] = [];
    for (const keyObject of keyObjects) {
      keys.push(keyObject.key);
    }

    return { keys: keys };
  });
});

router.delete("/uploadKey/:key", authenticateJWT, (req, res) => {
  wrapper(res, async () => {
    const keyObject = await prisma.uploadKey.findFirst({
      where: {
        key: req.params.key,
        userId: res.locals.user as string,
      },
    });
    if (!keyObject) {
      new ResourceNotFoundError({ resource: "uploadKey" }).send(res);
    };

    await prisma.uploadKey.delete({
      where: {
        key: req.params.key,
      },
    });

    return {};
  });
});

router.get("/info", authenticateJWT, (req, res) => {
  wrapper(res, () => {
    const user = res.locals.userObj as User;
    return {
      uuid: res.locals.user as string,
      username: user.username,
      email: user.email,
      createdAt: user.created.getTime(),
    };
  });
});

export const prefix = "/user";
export default router;