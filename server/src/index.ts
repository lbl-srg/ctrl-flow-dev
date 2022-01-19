import bodyParser from "body-parser";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import * as parser from "../../dependencies/modelica-json/lib/parser";
import { json } from "stream/consumers";

import config from "./config";

const app = express();

// Apply global middleware
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

const logMode = config.NODE_ENV == "development" ? "dev" : "combined";
app.use(morgan(logMode));

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
  console.log(`Listening on port ${config.PORT}`);
});
