import { Router } from "express";
import { createSignale, imageHashAsync } from "../utils";
import { prisma } from "../index";
import { randomInt } from "crypto";
import multer from "multer";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import { extname, join, resolve } from "path";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

const imageIdChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const imageStorageDir = process.env.IMAGE_STORAGE_DIR || "data/images";
const absoluteImageStorageDir = resolve(join(__dirname, "..", "..", imageStorageDir));

if (!existsSync(imageStorageDir)) {
  signale.warn(`Image storage directory ${imageStorageDir} does not exist. Creating it.`);
  mkdirSync(imageStorageDir);
}

router.post("/upload", multer().single("image"), async (req, res) => {
  try {
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
        size: image.size
      }
    });

    await writeFile(join(absoluteImageStorageDir, `${dbImage.uuid}${extname(image.originalname)}`), image.buffer);

    res.json({
      success: true,
      shortid: shortImageId,
      uuid: dbImage.uuid
    });

  }
  catch (err) {
    res.status(500).json({
      success: false,
      error: err
    });
  }
});


export const prefix = "/image";
export default router;