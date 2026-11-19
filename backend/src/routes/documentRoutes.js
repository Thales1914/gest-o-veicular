import { Router } from 'express';
import { documentUpload, validateDocumentFile } from '../middlewares/documentUpload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { documentSchema } from '../validators/documentSchemas.js';
import { periodSchema, recordIdSchema } from '../validators/recordSchemas.js';

export function createDocumentRoutes(repository, vehicleService, authenticate) {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.use(asyncHandler(async (request, _response, next) => {
    request.vehicleId = recordIdSchema.parse(request.params.vehicleId);
    await vehicleService.detail(request.user.id, request.vehicleId);
    next();
  }));
  const id = request => recordIdSchema.parse(request.params.id);
  const found = record => {
    if (!record) throw new AppError('Documento não encontrado.', 404);
    return record;
  };
  router.get('/', asyncHandler(async (request, response) => {
    response.json({ documents: await repository.list(request.vehicleId, periodSchema.parse(request.query)) });
  }));
  router.post('/', documentUpload, asyncHandler(async (request, response) => {
    let input = request.body;
    if (request.is('multipart/form-data')) {
      try { input = JSON.parse(request.body?.data); }
      catch { throw new AppError('Informe os dados do documento no campo data.', 422); }
    }
    const document = await repository.create(request.vehicleId, documentSchema.parse(input), validateDocumentFile(request.file));
    response.status(201).json({ document });
  }));
  router.get('/:id', asyncHandler(async (request, response) => {
    response.json({ document: found(await repository.detail(request.vehicleId, id(request))) });
  }));
  router.put('/:id', asyncHandler(async (request, response) => {
    response.json({ document: found(await repository.update(request.vehicleId, id(request), documentSchema.parse(request.body))) });
  }));
  router.get('/:id/file', asyncHandler(async (request, response) => {
    const file = found(await repository.file(request.vehicleId, id(request)));
    if (!file.file_data) throw new AppError('Este documento não tem arquivo anexado.', 404);
    response.set({
      'Content-Type': file.file_mime,
      'Content-Disposition': `attachment; filename="documento"; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.send(file.file_data);
  }));
  router.put('/:id/file', asyncHandler(async (request, _response, next) => {
    found(await repository.detail(request.vehicleId, id(request)));
    next();
  }), documentUpload, asyncHandler(async (request, response) => {
    const file = validateDocumentFile(request.file);
    if (!file) throw new AppError('Selecione um arquivo para anexar.', 422);
    response.json({ document: found(await repository.attach(request.vehicleId, id(request), file)) });
  }));
  router.delete('/:id', asyncHandler(async (request, response) => {
    if (!await repository.remove(request.vehicleId, id(request))) throw new AppError('Documento não encontrado.', 404);
    response.status(204).end();
  }));
  return router;
}
