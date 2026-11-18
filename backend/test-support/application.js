import { readdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { DataType, newDb } from 'pg-mem';
import pg from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';

export async function createTestApplication(t) {
  let pool;
  let cleanup;
  if (process.env.TEST_DATABASE_URL) {
    const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const schema = `sprint3_${randomUUID().replaceAll('-', '')}`;
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new pg.Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      options: `-c search_path=${schema}`,
    });
    cleanup = async () => {
      await pool.end();
      await admin.query(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    };
  } else {
    const memoryDatabase = newDb();
    memoryDatabase.public.registerFunction({
      name: 'to_char', args: [DataType.date, DataType.text], returns: DataType.text,
      implementation: (value, format) => {
        if (format !== 'YYYY-MM-DD') throw new Error('Formato não suportado no teste');
        return new Date(value).toISOString().slice(0, 10);
      },
    });
    memoryDatabase.public.registerOperator({
      operator: '~', left: DataType.text, right: DataType.text, returns: DataType.bool,
      implementation: (value, pattern) => new RegExp(pattern).test(value),
    });
    const adapter = memoryDatabase.adapters.createPg();
    pool = new adapter.Pool();
    cleanup = () => pool.end();
  }
  t.after(cleanup);
  const directory = new URL('../src/database/migrations/', import.meta.url);
  for (const file of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
    await pool.query(await readFile(new URL(file, directory), 'utf8'));
  }
  const app = createApp({ db: pool, config: {
    jwtSecret: 'segredo-exclusivo-para-os-testes-com-32-caracteres',
    jwtExpiresIn: '1h', corsOrigin: '*',
  } });
  return { app, pool };
}

export async function createOwner(app, suffix = 'a') {
  const credentials = { email: `${suffix}@example.com`, password: 'senha-teste-123' };
  await request(app).post('/auth/register').send({ name: `Teste ${suffix}`, ...credentials }).expect(201);
  const login = await request(app).post('/auth/login').send(credentials).expect(200);
  const authorization = `Bearer ${login.body.token}`;
  const vehicle = await request(app).post('/vehicles').set('Authorization', authorization).send({
    brand: 'Honda', model: 'Civic', year: 2020, plate: 'ABC1D23', current_mileage: 45000,
  }).expect(201);
  return { authorization, vehicle: vehicle.body.vehicle };
}
