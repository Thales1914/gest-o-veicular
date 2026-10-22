import type { CreateDocumentInput, VehicleDocument } from '../types/document';
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

  async create(vehicleId: string, input: CreateDocumentInput) {
    const response = await api.post<{ document: VehicleDocument }>(`/vehicles/${vehicleId}/documents`, input);
    return response.data.document;
  },

  async remove(vehicleId: string, documentId: string) {
    await api.delete(`/vehicles/${vehicleId}/documents/${documentId}`);
  },
};
