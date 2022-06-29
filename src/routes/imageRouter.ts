import { Router } from "express";
import { createSignale, imageHashAsync } from "../utils";
import { prisma } from "../index";
import { randomInt } from "crypto";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { extname, join, resolve } from "path";
import jwt, { TokenExpiredError } from "jsonwebtoken";


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

router.post("/upload", multer().single("image"), async (req, res) => {
  try {
    const tokenHeader = req.headers["authorization"];
    if (!tokenHeader) return res.status(401).json({ success: false, error: "No  provided" });
    const token = tokenHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, error: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      if (!(decoded instanceof Object) ||
        !(typeof decoded.user === "string") ||
        !(typeof decoded.type === "string") ||
        !(decoded.type === "upload"))
        return res.status(401).json({ success: false, error: "Invalid token" });
      const keyObject = await prisma.uploadKey.findUnique({ where: { key: token } });
      if (!keyObject) return res.status(401).json({ success: false, error: "Invalid token" });
      const user = await prisma.user.findUnique({ where: { uuid: decoded.user } });
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid user" });
      }

      const image = req.file;

      if (!image) throw "No image provided";

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
          userId: user.uuid,
        },
      });

      await writeFile(join(absoluteImageStorageDir, `${dbImage.uuid}${extname(image.originalname)}`), image.buffer);

      res.json({
        success: true,
        shortid: shortImageId,
        uuid: dbImage.uuid,
      });
    }
    catch (err) {
      if (typeof err === typeof TokenExpiredError) {
        return res.status(403).json({ success: false, error: "Token expired" });
      }
      else {
        return res.status(401).json({ success: false, error: "Invalid token" });
      }
    }

  }
  catch (err) {
    res.status(500).json({
      success: false,
      error: err,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const imgId = req.params.id;

    const dbImage = await prisma.image.findUnique({
      where: {
        shortid: imgId,
      },
    });

    if (!dbImage) throw "Image not found";

    const imgPath = `${dbImage.uuid}${extname(dbImage.name)}`;

    if (!existsSync(join(absoluteImageStorageDir, imgPath))) throw "Image file not found";

    res.sendFile(imgPath, { root: absoluteImageStorageDir });
  }
  catch (err) {
    res.status(500).json({
      success: false,
      error: err,
    });
  }
});


router.get("/:id/meta", async (req, res) => {
  try {
    const imgId = req.params.id;

    const dbImage = await prisma.image.findUnique({
      where: {
        shortid: imgId,
      },
    });

    if (!dbImage) throw "Image not found";

    res.json({
      success: true,
      shortid: dbImage.shortid,
      uuid: dbImage.uuid,
      name: dbImage.name,
      uploaded: dbImage.uploaded,
      size: dbImage.size,
      hash: dbImage.hash,
    });
  }
  catch (err) {
    res.status(500).json({
      success: false,
      error: err,
    });
  }
});

export const prefix = "/image";
export default router;