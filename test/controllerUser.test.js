// tests/controllerUser.test.js
const request = require('supertest');
const app = require('../app');
const pool = require('../database/db');

describe('GET /usuarios', () => {
    it('debería devolver 200 y un array de usuarios', async () => {
        const res = await request(app).get('/usuarios');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

afterAll(async () => {
    await pool.end(); // ✅ cierra la conexión
});
