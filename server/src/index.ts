import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";

import * as parser from "../../dependencies/modelica-json/lib/parser";
import { json } from "stream/consumers";

import config from "./config";

const app = express();

// Ensure all requests are logged
const logMode = config.NODE_ENV == "development" ? "dev" : "combined";
app.use(morgan(logMode));

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

app.listen(config.PORT, () => {
  console.log(`Listenting on port ${config.PORT}`);
});
