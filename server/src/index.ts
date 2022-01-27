import bodyParser from "body-parser";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import fs from "fs";
import tmp from "tmp";

import config from "./config";
import * as parser from "../../dependencies/modelica-json/lib/parser";

const app = express();

// Apply global middleware
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

const logMode = config.NODE_ENV == "development" ? "dev" : "combined";
app.use(morgan(logMode));

// TODO: Investigate if 'tmp.dirSync' can be used to create the directory
// I haven't found the correct way to clean up on app exit/restart
const tempDirPath = "/tmp/tmp-linkage-widget";
if (!fs.existsSync(tempDirPath)) {
  fs.mkdirSync(tempDirPath);
}

// accept json in body, hand off to service
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/api/jsontomodelica", async (req, res) => {
  const jsonToConvert = req.body;
  const tmpFile = tmp.fileSync();

  fs.writeSync(tmpFile.fd, JSON.stringify(jsonToConvert));
  const modelica = parser.convertToModelica(tmpFile.name, tempDirPath);

  res.send(modelica);
});

app.post("/api/modelicatojson", async (req, res) => {
  const request = req.body;
  const tmpFile = tmp.fileSync();
  const parseMode = request.parseMode;
  const modelicaToConvert = request.modelica;
  const outputFormat: 'json' | 'raw-json' = request.format;
  const prettyPrint = false; // format json

  fs.writeSync(tmpFile.fd, JSON.stringify(modelicaToConvert));
  const json = parser.getJsons([tmpFile.name], parseMode, outputFormat, tempDirPath, prettyPrint);

  console.log(json);
  res.send(json);
});

app.listen(config.PORT, () => {
  console.log(`Listening on port ${config.PORT}`);
});
