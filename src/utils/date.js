const TZ = 'Asia/Makassar';

export function todayWITA() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function nowTimeWITA() {
  const t = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
  return t.replace(/^24/, '00');
}

export function toMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(/[:.]/).map(Number);
  return h * 60 + (m || 0);
}

function parseDate(date) {
  return new Date(`${date}T00:00:00`);
}

export function formatDate(date) {
  if (!date) return '-';
  return parseDate(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatDayHeader(date) {
  if (!date) return '-';
  return parseDate(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function sortByDateTimeDesc(items) {
  return [...items].sort(
    (a, b) => (b.date || '').localeCompare(a.date || '') || toMinutes(b.time) - toMinutes(a.time),
  );
}

export function groupByDate(items) {
  const groups = new Map();
  for (const item of sortByDateTimeDesc(items)) {
    const key = item.date || '-';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups].map(([date, list]) => ({ date, items: list }));
}
