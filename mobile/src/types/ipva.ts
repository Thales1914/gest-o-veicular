export type IpvaStatus = 'pendente' | 'pago';

export type IpvaRecord = {
  id: string;
  vehicle_id: string;
  year: number;
  total_value: number;
  installments: number;
  installment_value: number;
  due_date: string;
  status: IpvaStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type CreateIpvaInput = {
  year: number;
  total_value: number;
  installments: number;
  due_date: string;
  status: IpvaStatus;
  notes?: string;
};
