import "dotenv/config";
import express from 'express';
import signale from "signale";

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => signale.success(`[*] Listening on port ${port}`));