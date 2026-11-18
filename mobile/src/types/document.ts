export type DocumentType = 'crlv' | 'seguro' | 'licenciamento' | 'cnh' | 'outro';

export type VehicleDocument = {
  id: string;
  vehicle_id: string;
  type: DocumentType;
  title: string;
  number?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type CreateDocumentInput = {
  type: DocumentType;
  title: string;
  number?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
};

export const documentTypeLabels: Record<DocumentType, string> = {
  crlv: 'CRLV',
  seguro: 'Seguro',
  licenciamento: 'Licenciamento',
  cnh: 'CNH',
  outro: 'Outro',
};
