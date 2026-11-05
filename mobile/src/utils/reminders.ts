import type { CareItem } from '../types/care';
import type { DeadlineItem } from '../types/deadline';

export type PlannedReminder = {
  id: string;
  title: string;
  body: string;
  date: Date;
};

const careLabels: Record<CareItem['type'], string> = {
  oleo: 'Troca de óleo',
  revisao: 'Revisão',
  pneus: 'Pneus',
  bateria: 'Bateria',
};

// Monta a data local "dia às 9h" a partir de AAAA-MM-DD.
function atHour(isoDate: string, hour: number) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, hour, 0, 0);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Próximo horário das 9h a partir de agora (hoje, se ainda não passou, ou amanhã).
function nextReminderTime(now: Date, hour: number) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
  return today > now ? today : addDays(today, 1);
}

/**
 * Decide quais lembretes agendar para um veículo:
 * - documentos e parcelas de IPVA: um aviso 7 dias antes e outro no dia do vencimento, às 9h;
 * - cuidados (óleo, revisão, pneus, bateria) próximos ou vencidos por km: um aviso no próximo horário das 9h.
 * Só entram datas que ainda estão no futuro.
 */
export function planReminders(
  vehicleName: string,
  deadlines: DeadlineItem[],
  care: CareItem[],
  now = new Date(),
  hour = 9,
): PlannedReminder[] {
  const reminders: PlannedReminder[] = [];

  for (const item of deadlines) {
    const key = `${item.kind}:${item.id}:${item.installment_number ?? 0}`;
    const dueDate = atHour(item.due_date, hour);
    const weekBefore = addDays(dueDate, -7);
    if (weekBefore > now) {
      reminders.push({
        id: `${key}:7d`,
        title: `${item.title} vence em 7 dias`,
        body: `${vehicleName}: o vencimento é em ${item.due_date.split('-').reverse().join('/')}.`,
        date: weekBefore,
      });
    }
    if (dueDate > now) {
      reminders.push({
        id: `${key}:0d`,
        title: `${item.title} vence hoje`,
        body: `${vehicleName}: não esqueça de regularizar.`,
        date: dueDate,
      });
    }
  }

  for (const item of care) {
    if (item.status !== 'soon' && item.status !== 'overdue') continue;
    reminders.push({
      id: `care:${item.type}`,
      title: item.status === 'overdue' ? `${careLabels[item.type]} vencida` : `${careLabels[item.type]} chegando`,
      body: item.status === 'overdue'
        ? `${vehicleName}: já passou da quilometragem prevista.`
        : `${vehicleName}: faltam ${item.remaining_km} km para a próxima troca.`,
      date: nextReminderTime(now, hour),
    });
  }

  return reminders.sort((a, b) => a.date.getTime() - b.date.getTime());
}
