import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');

test('arquivos: upload, download protegido, substituição e exclusão', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const other = await createOwner(app, 'other');
  const path = `/vehicles/${owner.vehicle.id}/documents`;
  const created = await request(app).post(path).set('Authorization', owner.authorization)
    .field('data', JSON.stringify({ type: 'crlv', title: 'CRLV com arquivo' }))
    .attach('file', pdf, { filename: '../crlv.exe', contentType: 'application/octet-stream' }).expect(201);
  const record = created.body.document;
  assert.equal(record.attachment.mime_type, 'application/pdf');
  assert.equal(record.attachment.name, 'crlv.pdf');
  assert.equal(record.file_data, undefined);
  const filePath = `${path}/${record.id}/file`;
  await request(app).get(filePath).expect(401);
  await request(app).get(filePath).set('Authorization', other.authorization).expect(404);
  const download = await request(app).get(filePath).set('Authorization', owner.authorization).expect(200);
  assert.equal(download.headers['content-type'], 'application/pdf');
  assert.equal(download.headers['cache-control'], 'private, no-store');
  assert.deepEqual(download.body, pdf);
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from('example')]);
  await request(app).put(filePath).set('Authorization', other.authorization).attach('file', png, 'foto.png').expect(404);
  await request(app).put(filePath).set('Authorization', owner.authorization).attach('file', png, 'foto.png').expect(200);
  const detail = await request(app).get(`${path}/${record.id}`).set('Authorization', owner.authorization).expect(200);
  assert.equal(detail.body.document.attachment.mime_type, 'image/png');
  await request(app).delete(`${path}/${record.id}`).set('Authorization', owner.authorization).expect(204);
  await request(app).get(filePath).set('Authorization', owner.authorization).expect(404);
});

test('arquivos: rejeita conteúdo inválido, tamanho excessivo e metadados inválidos sem criar registros', async (t) => {
  const { app, pool } = await createTestApplication(t);
  const owner = await createOwner(app);
  const path = `/vehicles/${owner.vehicle.id}/documents`;
  for (const contents of [Buffer.from('<script>bad</script>'), Buffer.alloc(0)]) {
    await request(app).post(path).set('Authorization', owner.authorization)
      .field('data', JSON.stringify({ type: 'crlv', title: 'Inválido' }))
      .attach('file', contents, { filename: 'fake.pdf', contentType: 'application/pdf' }).expect(422);
  }
  await request(app).post(path).set('Authorization', owner.authorization)
    .field('data', '{').attach('file', pdf, 'doc.pdf').expect(422);
  await request(app).post(path).set('Authorization', owner.authorization)
    .field('data', JSON.stringify({ type: 'crlv', title: '' })).attach('file', pdf, 'doc.pdf').expect(422);
  await request(app).post(path).set('Authorization', owner.authorization)
    .field('data', JSON.stringify({ type: 'crlv', title: 'Grande' }))
    .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), 'grande.pdf').expect(413);
  const records = await pool.query('SELECT COUNT(*) AS total FROM vehicle_documents');
  assert.equal(Number(records.rows[0].total), 0);
});
