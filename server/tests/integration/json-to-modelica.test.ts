import request from "supertest";

import { BUS_JSON, BUS_MODELICA } from "../static-data/modelica";
import { stripSpacing } from "../utilities";

const PORT = process.env.PORT ? process.env.port : 3000;
const req = request(`http://localhost:${PORT}`);

describe("JSON to Modelica", () => {
  it("Converts JSON to Modelica", () => {
    req
      .post('/api/jsontomodelica')
      .send(BUS_JSON)
      .set('Accept', 'application/json')
      .expect(200)
      .then((res) => {
        expect(res).not.toBeNull();
        expect(stripSpacing(res.text)).toBe(stripSpacing(BUS_MODELICA));
      })
  });
});
