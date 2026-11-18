export class DeadlineRepository {
  constructor(db) { this.db = db; }

  // Documentos com vencimento informado e IPVAs ainda não pagos.
  async listDueItems(vehicleId) {
    const documents = await this.db.query(
      `SELECT id, title, type, to_char(expiry_date, 'YYYY-MM-DD') AS due_date
       FROM vehicle_documents WHERE vehicle_id = $1 AND expiry_date IS NOT NULL`,
      [vehicleId],
    );
    const ipva = await this.db.query(
      `SELECT id, year, installments, installment_details
       FROM ipva_records WHERE vehicle_id = $1 AND status = 'pendente'`,
      [vehicleId],
    );
    return [
      ...documents.rows.map((row) => ({
        kind: 'document', id: String(row.id), title: row.title, type: row.type, due_date: row.due_date.slice(0, 10),
      })),
      ...ipva.rows.flatMap((row) => row.installment_details.filter(item => item.status === 'pendente').map(item => ({
        kind: 'ipva', id: String(row.id), title: `IPVA ${row.year}${row.installments > 1 ? ` • parcela ${item.number}/${row.installments}` : ''}`,
        type: 'ipva', due_date: item.due_date, amount: item.amount, installment_number: item.number,
      }))),
    ];
  }
}
