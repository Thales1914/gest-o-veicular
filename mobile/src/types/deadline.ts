export type DeadlineItem = {
  kind: 'document' | 'ipva';
  id: string;
  title: string;
  type: string;
  due_date: string;
  days_left: number;
  status: 'vencido' | 'proximo';
};

export type DeadlineSummary = {
  vehicle_id: string;
  days: number;
  overdue_count: number;
  upcoming_count: number;
  items: DeadlineItem[];
};
