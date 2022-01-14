import express from 'express';
import bodyParser from 'body-parser';

import parser from "@modelica-json/parser";

const app = express();
const PORT = 3000; // TODO: move to ENV file to share with docker-compose

app.use(bodyParser.json())

// accept json in body, hand off to service
app.get('/', (req, res) => {
  res.send('Hello world');
});

app.post('/api/jsontomodelica', async (req, res) => {
    const jsonToConvert = req.body;

    // TODO: a better place to store converted modelica needs to be found.
    const modelica = parser.convertToModelica(jsonToConvert, "./modelica");
    // TODO call parser directly
});

app.listen(PORT, () => {
  console.log(`Express with Typescript! http://localhost:${PORT}`);
});
