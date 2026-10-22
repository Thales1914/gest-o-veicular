import assert from 'node:assert/strict';
import { once } from 'node:events';
import { config } from 'dotenv';
import { createTestApplication } from '../test-support/application.js';

config({ path: new URL('../.env', import.meta.url), quiet: true });
assert.ok(process.env.DATABASE_URL, 'Configure DATABASE_URL no backend/.env.');
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
const cleanup = [];
const { app } = await createTestApplication({ after: callback => cleanup.push(callback) });
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
let checks = 0;
async function call(method, path, status, token, body) {
  const multipart = body instanceof FormData;
  const response = await fetch(base + path, {
    method, headers: { ...(!multipart ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  assert.equal(response.status, status, `${method} ${path}`);
  checks++;
  if (response.status === 204) return null;
  if (response.headers.get('content-type')?.startsWith('application/pdf')) return Buffer.from(await response.arrayBuffer());
  return response.json();
}

try {
  assert.equal((await call('GET', '/health/ready', 200)).database, 'connected');
  const tokens = [];
  for (const suffix of ['owner', 'other']) {
    const credentials = { email: `${suffix}@audit.example`, password: 'audit-password-local-123' };
    await call('POST', '/auth/register', 201, null, { ...credentials, name: 'Auditoria' });
    tokens.push((await call('POST', '/auth/login', 200, null, credentials)).token);
  }
  const [token, other] = tokens;
  const vehicle = (await call('POST', '/vehicles', 201, token, { brand: 'Honda', model: 'Civic', year: 2020, plate: 'ABC1D23', current_mileage: 45000 })).vehicle;
  const path = `/vehicles/${vehicle.id}`;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const pdf = Buffer.from('%PDF-1.4\naudit\n%%EOF');
  const form = new FormData();
  form.append('data', JSON.stringify({ type: 'crlv', title: 'CRLV de auditoria', expiry_date: date }));
  form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'crlv.pdf');
  const document = (await call('POST', `${path}/documents`, 201, token, form)).document;
  assert.deepEqual(await call('GET', `${path}/documents/${document.id}/file`, 200, token), pdf);
  await call('GET', `${path}/documents/${document.id}/file`, 401);
  await call('GET', `${path}/documents/${document.id}/file`, 404, other);
  const input = { year: 2026, total_value: 100, installments: 3, due_date: date, status: 'pendente' };
  const ipva = (await call('POST', `${path}/ipva`, 201, token, input)).ipva_record;
  assert.equal(ipva.installment_details.reduce((sum, item) => sum + Math.round(item.amount * 100), 0), 10000);
  const before = (await call('GET', `${path}/deadlines?days=365`, 200, token)).deadlines;
  assert.equal(before.items.length, 4);
  const details = ipva.installment_details.map((item, index) => ({ ...item, status: index === 0 ? 'pago' : 'pendente' }));
  const partial = (await call('PUT', `${path}/ipva/${ipva.id}`, 200, token, { ...input, installment_details: details })).ipva_record;
  assert.equal(partial.paid_installments, 1);
  assert.equal((await call('GET', `${path}/deadlines?days=365`, 200, token)).deadlines.items.length, 3);
  for (const suffix of ['documents', 'ipva', 'deadlines']) {
    await call('GET', `${path}/${suffix}`, 401);
    await call('GET', `${path}/${suffix}`, 404, other);
    await call('GET', `${path}/${suffix}`, 200, token);
  }
  await call('POST', `${path}/ipva`, 409, token, input);
  await call('POST', `${path}/documents`, 422, token, { type: 'crlv', title: '' });
  await call('GET', `${path}/deadlines?days=366`, 422, token);
  await call('DELETE', `${path}/documents/${document.id}`, 404, other);
  await call('DELETE', `${path}/ipva/${ipva.id}`, 404, other);
  for (const removed of ['history', 'care']) await call('GET', `${path}/${removed}`, 404, token);
  await call('DELETE', `${path}/documents/${document.id}`, 204, token);
  await call('GET', `${path}/documents/${document.id}/file`, 404, token);
  await call('DELETE', `${path}/ipva/${ipva.id}`, 204, token);
  assert.equal((await call('GET', `${path}/deadlines`, 200, token)).deadlines.items.length, 0);
  await call('DELETE', path, 204, token);
  console.log(JSON.stringify({ result: 'ok', database: 'PostgreSQL real', transport: 'HTTP real', checks, isolated_schema: true }));
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  for (const callback of cleanup.reverse()) await callback();
}
