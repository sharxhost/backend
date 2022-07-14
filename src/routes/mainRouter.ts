import { Router } from "express";
import { createSignale, wrapper } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signale = createSignale(__filename);

const router = Router();

router.get("/", (req, res) => {
  wrapper(res, () => {
    return {
      message: "Hello World!",
    };
  });
});

export default router;