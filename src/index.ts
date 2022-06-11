import "dotenv/config";
import express from 'express';
import signale from "signale";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => signale.success(`Listening on port ${port}`));