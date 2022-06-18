import { Router } from "express";
import { createSignale } from "../utils";
import { exec } from "child_process";
import { promisify } from "util";
import { prisma, startTime } from "../index";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

router.get("/info", async (req, res) => {
  try {
    const { stdout } = await promisify(exec)("git describe --tags --always");
    res.json({
      success: true,
      gitver: stdout.trim(),
      name: process.env.CUSTOM_HOST_NAME || "SharX"
    });
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: "error while running git describe",
      error: err
    });
  }
});

router.get("/stats", async (req, res) => {
  res.json({
    success: true,
    uptime: Math.floor(Date.now() / 1000) - Math.floor(startTime.getTime() / 1000),
    images: await prisma.image.count(),
  });
});

export const prefix = "/service";
export default router;