import { UNFINISHED_STATUSES } from '../constants';

export function buildAppointmentMarkers(appointments = []) {
  const map = {};

  for (const item of appointments) {
    if (!item?.date) continue;
    const date = item.date;
    if (!map[date]) {
      map[date] = { total: 0, done: 0, hasUrgent: false };
    }
    map[date].total += 1;
    if (!UNFINISHED_STATUSES.includes(item.status)) {
      map[date].done += 1;
    }
    if (item.priority === 'urgent') {
      map[date].hasUrgent = true;
    }
  }

  const markers = {};
  for (const [date, data] of Object.entries(map)) {
    let color = 'green';
    if (data.hasUrgent) {
      color = 'red';
    } else if (data.done < data.total) {
      color = 'yellow';
    }
    markers[date] = {
      color,
      done: data.done,
      total: data.total,
    };
  }

  return markers;
}

export function buildRecordMarkers(records = []) {
  const map = {};

  for (const item of records) {
    if (!item?.date) continue;
    const date = item.date;
    if (!map[date]) {
      map[date] = { total: 0, hasUrgent: false };
    }
    map[date].total += 1;
    if (item.service === 'Penanganan Darurat') {
      map[date].hasUrgent = true;
    }
  }

  const markers = {};
  for (const [date, data] of Object.entries(map)) {
    markers[date] = {
      color: data.hasUrgent ? 'red' : 'green',
      done: data.total,
      total: data.total,
    };
  }

  return markers;
}
