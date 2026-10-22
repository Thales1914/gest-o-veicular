const DAY_IN_MS = 24 * 60 * 60 * 1000;

function localToday(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now());
  const value = type => Number(parts.find(part => part.type === type).value);
  return Date.UTC(value('year'), value('month') - 1, value('day'));
}

function daysBetween(today, isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - today) / DAY_IN_MS);
}

export class DeadlineService {
  constructor(repository, vehicleService, now = () => new Date()) {
    this.repository = repository;
    this.vehicleService = vehicleService;
    this.now = now;
  }

  // Junta documentos e IPVA que já venceram ou vencem dentro de "days" dias.
  async summarize(userId, vehicleId, { days }) {
    await this.vehicleService.detail(userId, vehicleId);
    const today = localToday(this.now);
    const items = (await this.repository.listDueItems(vehicleId))
      .map((item) => {
        const daysLeft = daysBetween(today, item.due_date);
        return { ...item, days_left: daysLeft, status: daysLeft < 0 ? 'vencido' : 'proximo' };
      })
      .filter((item) => item.days_left <= days)
      .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.kind.localeCompare(b.kind)
        || (BigInt(a.id) === BigInt(b.id) ? 0 : BigInt(a.id) < BigInt(b.id) ? -1 : 1)
        || (a.installment_number ?? 0) - (b.installment_number ?? 0));

    return {
      vehicle_id: String(vehicleId),
      days,
      overdue_count: items.filter((item) => item.status === 'vencido').length,
      upcoming_count: items.filter((item) => item.status === 'proximo').length,
      items,
    };
  }
}
