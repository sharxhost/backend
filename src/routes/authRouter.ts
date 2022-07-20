import { NextFunction, Request, Response, Router } from "express";
import { prisma } from "../index";
import { createSignale, wrapper } from "../utils";
import { randomBytes, createHmac } from "crypto";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { AuthJWT, Prisma, User } from "@prisma/client";
import { ExpiredTokenError, IllegalCharacterError, InvalidAuthHeaderError, InvalidCredentialsError, InvalidTokenError, TooLongFieldError, TooShortFieldError, UserAlreadyRegisteredError } from "../../api-types/src/errors";
import { AuthChangePasswordBody, AuthCreateBody, AuthLoginBody } from "../../api-types/src/routes/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  wrapper(res, async () => {
    const tokenHeader = req.headers["authorization"];
    if (!tokenHeader) throw new InvalidAuthHeaderError;
    const token = tokenHeader.split(" ")[1];
    if (!token) throw new InvalidAuthHeaderError;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      if (!(decoded instanceof Object) ||
        !(typeof decoded.user === "string") ||
        !(typeof decoded.type === "string") ||
        !(decoded.type === "auth"))
        throw new InvalidTokenError;
      const tokenObj = await prisma.authJWT.findUnique({
        where: {
          token: token,
        },
        include: {
          user: true,
        },
      });
      if (!tokenObj) {
        throw new InvalidTokenError;
      }

      res.locals.user = tokenObj.user.uuid;
      res.locals.userObj = tokenObj.user;
      res.locals.jwt = tokenObj;
      next();
    }
    catch (err) {
      if (typeof err === typeof TokenExpiredError) {
        throw new ExpiredTokenError;
      }
      else {
        throw new InvalidTokenError;
      }
    }
  });
}

function checkUsername(username: string) {
  if (username.length < 3) throw new TooShortFieldError({ field: "username", minLength: 3 });
  if (username.length > 16) throw new TooLongFieldError({ field: "username", maxLength: 16 });

  for (const c of username) {
    if (!([..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"].includes(c)))
      throw new IllegalCharacterError({ field: "username", character: c });
  }
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

async function genJWT(user: string, ip: string) {
  const token = jwt.sign({ user: user, ip: ip, type: "auth", rnd: randomBytes(8).toString("hex") }, process.env.JWT_SECRET as string, { expiresIn: "14d" });
  await prisma.authJWT.create({
    data: {
      userId: user,
      token: token,
    },
  });
  return token;
}

router.post("/create", (req, res) => {
  wrapper(res, async () => {
    const { username, password, email } = req.body as AuthCreateBody;

    checkUsername(username);
    if (password.length < 5) throw new TooShortFieldError({ field: "password", minLength: 5 });
    if (email.length < 1) throw new TooShortFieldError({ field: "email", minLength: 1 });

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

      const token = await genJWT(user.uuid, req.ip);

      return {
        uuid: user.uuid,
        token: token,
      };
    }
    catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          throw new UserAlreadyRegisteredError({
            field: (err.meta?.target as string[])[0],
          });
        }
      }
      throw err;
    }
  });
});

router.post("/login", (req, res) => {
  wrapper(res, async () => {
    const { password, email } = req.body as AuthLoginBody;

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) throw new InvalidCredentialsError;

    const { hash } = hashPassword(password, user.passwordSalt);

    if (hash !== user.passwordHash) throw new InvalidCredentialsError;

    const token = await genJWT(user.uuid, req.ip);

    return {
      uuid: user.uuid,
      token: token,
    };
  });
});

router.delete("/logout", authenticateJWT, (req, res) => {
  wrapper(res, async () => {
    await prisma.authJWT.delete({
      where: {
        token: (res.locals.jwt as AuthJWT).token,
      },
    });

    return {};
  });
});

router.post("/changePassword", authenticateJWT, (req, res) => {
  wrapper(res, async () => {
    const { oldPassword, password } = req.body as AuthChangePasswordBody;

    if (password.length < 5) throw new TooShortFieldError({
      field: "password",
      minLength: 5,
    });

    const user = res.locals.userObj as User;

    const { hash: oldHash } = hashPassword(oldPassword, user.passwordSalt);

    if (oldHash !== user.passwordHash) throw new InvalidCredentialsError;

    const { hash, salt } = hashPassword(password);

    await prisma.user.update({
      where: {
        uuid: user.uuid,
      },
      data: {
        passwordHash: hash,
        passwordSalt: salt,
      },
    });

    await prisma.authJWT.deleteMany({
      where: {
        userId: user.uuid,
      },
    });

    return {};
  });
});

export const prefix = "/auth";
export default router;