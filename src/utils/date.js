const TZ = 'Asia/Makassar';

// Ambil angka per bagian (tahun, bulan, jam, ...) lewat formatToParts.
// Jangan mengandalkan hasil format() utuh: sebagian browser HP memberi "11/19/2026"
// untuk locale en-CA, sehingga kalender jadi "Invalid Date".
function partsWITA(options) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...options }).formatToParts(new Date());
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

export function todayWITA() {
  const { year, month, day } = partsWITA({ year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function nowTimeWITA() {
  const { hour, minute } = partsWITA({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${hour.replace(/^24$/, '00').padStart(2, '0')}:${minute.padStart(2, '0')}`;
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
