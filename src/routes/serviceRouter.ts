import { Router } from "express";
import { createSignale, getOutput } from "../utils";
import { prisma, startTime } from "../index";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

router.get("/info", async (req, res) => {
  try {
    res.json({
      success: true,
      git: {
        commit: await getOutput("git rev-parse HEAD"),
        tag: await getOutput("git describe --tags"),
        branch: await getOutput("git rev-parse --abbrev-ref HEAD"),
      },
      name: process.env.CUSTOM_HOST_NAME || "SharX",
    });
  }
  catch (err) {
    res.status(500).json({
      success: false,
      message: "error while running git describe",
      error: err,
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