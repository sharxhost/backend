import { NextFunction, Request, Response, Router } from "express";
import { prisma } from "../index";
import { createSignale } from "../utils";
import { randomBytes, createHmac } from "crypto";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const tokenHeader = req.headers["authorization"];
  if (!tokenHeader) return res.status(401).json({ success: false, error: "No token provided" });
  const token = tokenHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (!(decoded instanceof Object) ||
      !(typeof decoded.user === "string") ||
      !(typeof decoded.type === "string") ||
      !(decoded.type === "auth"))
      return res.status(403).json({ success: false, error: "Invalid token" });
    res.locals.user = decoded.user;
    next();
  }
  catch (err) {
    if (typeof err === typeof TokenExpiredError) {
      return res.status(403).json({ success: false, error: "Token expired" });
    }
    else {
      return res.status(403).json({ success: false, error: "Invalid token" });
    }
  }

}

interface CreateUserBody {
  username: string;
  password: string;
  email: string;
}

function checkUsername(username: string): boolean | string {
  if (username.length < 3) return "Too short! Minimum 3 characters";
  if (username.length > 16) return "Too long! Maximum 16 characters";

  for (const c of username) {
    if (!([..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"].includes(c)))
      return `Invalid character: ${c}`;
  }

  return true;
}

function hashPassword(password: string, salt?: string): { hash: string, salt: string } {
  if (!salt)
    salt = randomBytes(6).toString("hex");

  const hash = createHmac("sha512", salt);
  hash.update(password);
  const hashDigest = hash.digest("hex");

  return {
    hash: hashDigest,
    salt: salt,
  };
}

router.post("/create", async (req, res) => {
  try {
    const { username, password, email } = req.body as CreateUserBody;

    const usernameError = checkUsername(username);
    if (usernameError !== true) throw usernameError;
    if (password.length == 0) throw "Please specify a password";
    if (email.length == 0) throw "Please specify an email";

    const { hash, salt } = hashPassword(password);

    try {
      const user = await prisma.user.create({
        data: {
          username: username,
          passwordHash: hash,
          passwordSalt: salt,
          email: email,
        },
      });

      const token = jwt.sign({ user: user.uuid, ip: req.ip, type: "auth" }, process.env.JWT_SECRET as string, { expiresIn: "14d" });

      res.json({
        success: true,
        uuid: user.uuid,
        token: token,
      });
    }
    catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") throw "User already exists";
      }
      throw err;
    }
  }
  catch (err) {
    res.json({
      success: false,
      error: err,
    });
  }
});

interface LoginBody {
  email: string;
  password: string;
}

router.post("/login", async (req, res) => {
  try {
    const { password, email } = req.body as LoginBody;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) throw "Invalid credentials";

    const { hash } = hashPassword(password, user.passwordSalt);

    if (hash !== user.passwordHash) throw "Invalid credentials";

    const token = jwt.sign({ user: user.uuid, ip: req.ip, type: "auth" }, process.env.JWT_SECRET as string, { expiresIn: "14d" });

    res.json({
      success: true,
      uuid: user.uuid,
      token: token,
    });
  }
  catch (err) {
    res.json({
      success: false,
      error: err,
    });
  }
});

export const prefix = "/auth";
export default router;