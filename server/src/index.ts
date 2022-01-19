import express from "express";
import bodyParser from "body-parser";

import * as parser from "../../dependencies/modelica-json/lib/parser";
import { json } from "stream/consumers";

const app = express();
const PORT = 3000; // TODO: move to ENV file to share with docker-compose

app.use(bodyParser.json());

// accept json in body, hand off to service
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/api/jsontomodelica", async (req, res) => {
  // const jsonToConvert = req.body;
  // // TODO: a better place to store converted modelica needs to be found.
  // const modelica = parser.convertToModelica(jsonToConvert, "./modelica");

  res.send("TODO: convert json to modelica");
});

app.post("/api/modelicatojson", async (req, res) => {
  // TODO
  res.send("TODO: convert modelica to JSON");
});

app.listen(PORT, () => {
  console.log(`Express with Typescript! http://localhost:${PORT}`);
});
