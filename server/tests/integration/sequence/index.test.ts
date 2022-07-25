import request from "supertest";

const PORT = process.env.PORT ? process.env.port : 3000;
const req = request(`http://localhost:${PORT}`);

const TIMEOUT_IN_MILLISECONDS = 30000;

describe("Control Sequence Document endpoint", () => {
  it(
    "Responds with a 200",
    () => {
      req.post("/api/sequence").expect(200);
    },
    TIMEOUT_IN_MILLISECONDS,
  );
});
