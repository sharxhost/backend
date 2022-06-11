import "dotenv/config";
import express from 'express';
import signale from "signale";

const app = express();
const port = process.env.PORT || 3000;

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, () => signale.success(`Listening on port ${port}`));