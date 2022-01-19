import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";

import * as parser from "../../dependencies/modelica-json/lib/parser";
import { json } from "stream/consumers";

const app = express();
const PORT = 3000; // TODO: move to ENV file to share with docker-compose

// Ensure all requests are logged
app.use(morgan("dev"));

app.use(bodyParser.json());

// accept json in body, hand off to service
app.get("/", (req, res) => {
  res.send(
    "<pre>" + JSON.stringify(process.env.NODE_ENV, null, "  ") + "</pre>",
  );
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
  console.log(`Listenting on port ${PORT}`);
});
