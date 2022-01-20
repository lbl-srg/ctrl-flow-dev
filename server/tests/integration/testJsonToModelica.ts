import request from "supertest";

import { BUS_JSON, BUS_MODELICA } from './staticData';

const PORT = process.env.PORT ? process.env.port : 3000;

const req = request(`http://localhost:${PORT}`);

describe('JSON to Modelica', () => {
    it('Converts JSON to Modelica', () => {
        expect(true).toBeTruthy();
        req.post('/api/jsontomodelica')
           .send(BUS_JSON)
           .expect( res => {
                expect(res).not.toBeNull();
                expect(res).toBe(BUS_MODELICA);
            });
    })
});
