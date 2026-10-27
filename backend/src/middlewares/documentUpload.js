import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 1, fieldSize: 32768, parts: 2 },
});

export function documentUpload(request, response, next) {
  upload.single('file')(request, response, (error) => {
    if (!error) return next();
    next(new AppError(error.code === 'LIMIT_FILE_SIZE'
      ? 'O arquivo deve ter no máximo 10 MB.' : 'Envio inválido. Envie um único arquivo e os dados do documento.',
    error.code === 'LIMIT_FILE_SIZE' ? 413 : 400));
  });
}

export function validateDocumentFile(file) {
  if (!file) return undefined;
  const bytes = file.buffer;
  let mime;
  let extension;
  if (bytes.subarray(0, 5).toString() === '%PDF-') { mime = 'application/pdf'; extension = 'pdf'; }
  else if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) { mime = 'image/png'; extension = 'png'; }
  else if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { mime = 'image/jpeg'; extension = 'jpg'; }
  else if (bytes.length >= 12 && bytes.subarray(4, 8).toString() === 'ftyp'
    && ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(bytes.subarray(8, 12).toString())) { mime = 'image/heic'; extension = 'heic'; }
  if (!mime || bytes.length === 0) throw new AppError('Envie um PDF ou imagem JPG, PNG ou HEIC válida.', 422);
  const rawName = file.originalname.replaceAll('\\', '/').split('/').pop() ?? 'documento';
  const safeStem = rawName.replace(/\.[^.]*$/, '').replace(/[^\p{L}\p{N} _.-]/gu, '').slice(0, 140).trim() || 'documento';
  return { buffer: bytes, name: `${safeStem}.${extension}`, mime, size: bytes.length };
}
