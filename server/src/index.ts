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
  const modelicaFile = tmp.fileSync();
  const { format, modelica, parseMode } = request;
  const prettyPrint = false; // format json

  fs.writeSync(modelicaFile.fd, modelica);
  let response: any;

  try {
    // getJsons will aways return an empty array (but it looks like it should?).
    // To get around this read from the file that gets output during parsing
    parser.getJsons([modelicaFile.name], parseMode, format, tempDirPath, prettyPrint);
    // NOTE: 'modelicaFile.name' is a full path name (e.g. '/tmp/<tmp-file-name>)!
    // For now I'm using a kludge to re-use this full path to get to the output path
    // full path looks something like: /<tmpDirPath>/json/tmp/<tmp-file-name>
    // TODO: figure out a better way to coordinate tempfile generation and teardown
    response = fs.readFileSync(`${tempDirPath}/json/${modelicaFile.name}`, {encoding: "utf8"});
  } catch (error) {
    // TODO: put in a proper error response
    response = error;
  }

  res.send(response);
});

app.listen(config.PORT, () => {
  console.log(`Listening on port ${config.PORT}`);
});
