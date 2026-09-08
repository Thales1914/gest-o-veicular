import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { createApp } from '../src/app.js';

async function createTestApplication() {
  const memoryDatabase = newDb();
  memoryDatabase.public.registerOperator({
    operator: '~',
    left: DataType.text,
    right: DataType.text,
    returns: DataType.bool,
    implementation: (value, pattern) => new RegExp(pattern).test(value),
  });
  const migrationUrl = new URL('../src/database/migrations/001_initial_schema.sql', import.meta.url);
  const migration = await readFile(migrationUrl, 'utf8');
  memoryDatabase.public.none(migration);

  const adapter = memoryDatabase.adapters.createPg();
  const pool = new adapter.Pool();
  const app = createApp({
    db: pool,
    config: {
      jwtSecret: 'segredo-exclusivo-para-os-testes-com-32-caracteres',
      jwtExpiresIn: '1h',
      corsOrigin: '*',
    },
  });

  return { app, pool };
}

test('GET /health informa que a API está disponível', async () => {
  const { app, pool } = await createTestApplication();
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok' });
  await pool.end();
});

test('valida os seis fluxos mínimos da Sprint 01', async () => {
  const { app, pool } = await createTestApplication();

  // Fluxo 1: cadastro, login e recebimento do token sem expor o hash.
  const registration = await request(app).post('/auth/register').send({
    name: 'Usuário A',
    email: 'usuario.a@example.com',
    password: 'senha-segura',
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.body.user.email, 'usuario.a@example.com');
  assert.equal(registration.body.user.password_hash, undefined);

  const storedUser = await pool.query(
    'SELECT password_hash FROM users WHERE email = $1',
    ['usuario.a@example.com'],
  );
  assert.notEqual(storedUser.rows[0].password_hash, 'senha-segura');
  assert.match(storedUser.rows[0].password_hash, /^\$2[aby]\$/);

  const duplicateRegistration = await request(app).post('/auth/register').send({
    name: 'Usuário duplicado',
    email: 'USUARIO.A@example.com',
    password: 'senha-segura',
  });
  assert.equal(duplicateRegistration.status, 409);

  const loginA = await request(app).post('/auth/login').send({
    email: 'usuario.a@example.com',
    password: 'senha-segura',
  });
  assert.equal(loginA.status, 200);
  assert.ok(loginA.body.token);
  const tokenA = loginA.body.token;

  // Fluxo 2: cadastro e listagem de veículo do usuário autenticado.
  const invalidVehicle = await request(app)
    .post('/vehicles')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      plate: 'INVALIDA',
      current_mileage: 45000,
    });
  assert.equal(invalidVehicle.status, 422);

  const creation = await request(app)
    .post('/vehicles')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      plate: 'ABC1D23',
      current_mileage: 45000,
    });
  assert.equal(creation.status, 201);
  assert.equal(creation.body.vehicle.plate, 'ABC1D23');
  const vehicleId = String(creation.body.vehicle.id);

  const listA = await request(app)
    .get('/vehicles')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(listA.status, 200);
  assert.equal(listA.body.vehicles.length, 1);

  // Fluxo 3: outro usuário não lista nem acessa o veículo do usuário A.
  await request(app).post('/auth/register').send({
    name: 'Usuário B',
    email: 'usuario.b@example.com',
    password: 'outra-senha',
  }).expect(201);
  const loginB = await request(app).post('/auth/login').send({
    email: 'usuario.b@example.com',
    password: 'outra-senha',
  });
  const tokenB = loginB.body.token;

  const listB = await request(app)
    .get('/vehicles')
    .set('Authorization', `Bearer ${tokenB}`);
  assert.equal(listB.status, 200);
  assert.deepEqual(listB.body.vehicles, []);

  const forbiddenDetail = await request(app)
    .get(`/vehicles/${vehicleId}`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert.equal(forbiddenDetail.status, 404);

  // Fluxo 4: detalhe contém identificação e quilometragem.
  const detailA = await request(app)
    .get(`/vehicles/${vehicleId}`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(detailA.status, 200);
  assert.equal(detailA.body.vehicle.model, 'Civic');
  assert.equal(detailA.body.vehicle.current_mileage, 45000);

  // Fluxo 5: credenciais inválidas retornam erro adequado.
  const invalidLogin = await request(app).post('/auth/login').send({
    email: 'usuario.a@example.com',
    password: 'senha-incorreta',
  });
  assert.equal(invalidLogin.status, 401);
  assert.equal(invalidLogin.body.message, 'E-mail ou senha inválidos.');

  // Fluxo 6: rota protegida sem token nega o acesso.
  const unauthenticated = await request(app).get('/vehicles');
  assert.equal(unauthenticated.status, 401);

  await pool.end();
});
