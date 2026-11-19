import { Platform } from 'react-native';
import type { CreateDocumentInput, SelectedDocumentFile, VehicleDocument } from '../types/document';
import { api } from './api';

export const documentService = {
  async list(vehicleId: string) {
    const response = await api.get<{ documents: VehicleDocument[] }>(`/vehicles/${vehicleId}/documents`);
    return response.data.documents;
  },

  async detail(vehicleId: string, documentId: string) {
    const response = await api.get<{ document: VehicleDocument }>(`/vehicles/${vehicleId}/documents/${documentId}`);
    return response.data.document;
  },

  async create(vehicleId: string, input: CreateDocumentInput, file?: SelectedDocumentFile | null) {
    if (!file) {
      const response = await api.post<{ document: VehicleDocument }>(`/vehicles/${vehicleId}/documents`, input);
      return response.data.document;
    }

    const form = new FormData();
    form.append('data', JSON.stringify(input));
    form.append('file', await toFormFile(file), file.name);
    const response = await api.post<{ document: VehicleDocument }>(`/vehicles/${vehicleId}/documents`, form, {
      headers: { 'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data.document;
  },

  async update(vehicleId: string, documentId: string, input: CreateDocumentInput) {
    const response = await api.put<{ document: VehicleDocument }>(
      `/vehicles/${vehicleId}/documents/${documentId}`,
      input,
    );
    return response.data.document;
  },

  async attach(vehicleId: string, documentId: string, file: SelectedDocumentFile) {
    const form = new FormData();
    form.append('file', await toFormFile(file), file.name);
    const response = await api.put<{ document: VehicleDocument }>(
      `/vehicles/${vehicleId}/documents/${documentId}/file`,
      form,
      {
        headers: { 'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data' },
        timeout: 60000,
      },
    );
    return response.data.document;
  },

  async remove(vehicleId: string, documentId: string) {
    await api.delete(`/vehicles/${vehicleId}/documents/${documentId}`);
  },
};

async function toFormFile(file: SelectedDocumentFile) {
  if (Platform.OS === 'web') {
    return file.file ?? await (await fetch(file.uri)).blob();
  }

  return { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob;
}
