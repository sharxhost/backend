import { Router } from "express";
import { createSignale, imageHashAsync, wrapper } from "../utils";
import { prisma } from "../index";
import { randomInt } from "crypto";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { extname, join, resolve } from "path";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ExpiredTokenError, ImageNotFoundError, InvalidAuthHeaderError, InvalidTokenError, MalformedRequestError, ResourceAlreadyExistsError } from "../errors";
import { Prisma } from "@prisma/client";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

const imageIdChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const imageStorageDir = process.env.IMAGE_STORAGE_DIR || "data/images";
const absoluteImageStorageDir = resolve(join(__dirname, "..", "..", imageStorageDir));

if (!existsSync(imageStorageDir)) {
  signale.warn(`Image storage directory ${imageStorageDir} does not exist. Creating it.`);
  mkdirSync(absoluteImageStorageDir, { recursive: true });
}

router.post("/upload", multer().single("image"), (req, res) => {
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
        !(decoded.type === "upload"))
        throw new InvalidTokenError;
      const keyObject = await prisma.uploadKey.findUnique({
        where: {
          key: token,
        },
        include: {
          user: true,
        },
      });
      if (!keyObject) {
        throw new InvalidTokenError;
      }

      const image = req.file;

      if (!image) throw new MalformedRequestError({ field: "image" });

      const imageHash = await imageHashAsync({ data: image.buffer }, 16, true);
      let shortImageId = "";
      for (let i = 0; i < 8; i++) {
        shortImageId += imageIdChars[randomInt(0, imageIdChars.length - 1)];
      }

      const dbImage = await prisma.image.create({
        data: {
          shortid: shortImageId,
          name: image.originalname,
          hash: imageHash,
          size: image.size,
          userId: keyObject.user.uuid,
        },
      });

      await writeFile(join(absoluteImageStorageDir, `${dbImage.uuid}${extname(image.originalname)}`), image.buffer);

      return {
        shortid: shortImageId,
        uuid: dbImage.uuid,
      };
    }
    catch (err) {
      if (typeof err === typeof TokenExpiredError) {
        throw new ExpiredTokenError;
      }
      else if (typeof err === typeof JsonWebTokenError) {
        throw new InvalidTokenError;
      }
      else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          // TODO: Return the existing image's url OR create a new object using the old filename
          throw new ResourceAlreadyExistsError;
        }
      }
      else {
        throw err;
      }
    }
  });
});

router.get("/:id", (req, res) => {
  wrapper(res, async () => {
    const imgId = req.params.id;

    const dbImage = await prisma.image.findUnique({
      where: {
        shortid: imgId,
      },
    });

    if (!dbImage) throw new ImageNotFoundError;

    const imgPath = `${dbImage.uuid}${extname(dbImage.name)}`;

    if (!existsSync(join(absoluteImageStorageDir, imgPath))) throw new ImageNotFoundError;

    res.sendFile(imgPath, { root: absoluteImageStorageDir });
  });
});


router.get("/:id/meta", (req, res) => {
  wrapper(res, async () => {
    const imgId = req.params.id;

    const dbImage = await prisma.image.findUnique({
      where: {
        shortid: imgId,
      },
    });

    if (!dbImage) throw new ImageNotFoundError;

    return {
      shortid: dbImage.shortid,
      uuid: dbImage.uuid,
      name: dbImage.name,
      uploaded: dbImage.uploaded,
      size: dbImage.size,
      hash: dbImage.hash,
    };
  });
});

export const prefix = "/image";
export default router;