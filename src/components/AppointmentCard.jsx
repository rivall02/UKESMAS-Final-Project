import React from 'react';
import { Clock3 } from 'lucide-react';

const dateFmt = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

export default function AppointmentCard({ a }) {
  return (
    <div className="appt">
      <div className="cal">
        <b>{new Date(a.date + 'T00:00:00').getDate()}</b>
        <small>
          {new Date(a.date + 'T00:00:00')
            .toLocaleDateString('id-ID', { month: 'short' })
            .toUpperCase()}
        </small>
      </div>
      <div className="apptinfo">
        <b>{a.service}</b>
        <small>
          <Clock3 size={12} /> {a.time} WITA · {dateFmt(a.date)}
        </small>
        <small>{a.studentName}</small>
      </div>
      <span className={'status ' + a.status.toLowerCase()}>{a.status}</span>
    </div>
  );
}
