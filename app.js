const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.get("/", (req, res, next) => {
  res.send("Hello World!!");
});

app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));