import { Router } from "express";
import { createSignale } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hello World!",
  });
});

export default router;