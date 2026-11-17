import React from 'react';
import { Clock3, AlertTriangle } from 'lucide-react';

const dateFmt = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

export default function AppointmentCard({ a }) {
  const isUrgent = a.priority === 'urgent';

  return (
    <div className={isUrgent ? 'appt appt-urgent' : 'appt'}>
      <div className={isUrgent ? 'cal cal-urgent' : 'cal'}>
        {isUrgent ? (
          <AlertTriangle size={18} />
        ) : (
          <>
            <b>{new Date(a.date + 'T00:00:00').getDate()}</b>
            <small>
              {new Date(a.date + 'T00:00:00')
                .toLocaleDateString('id-ID', { month: 'short' })
                .toUpperCase()}
            </small>
          </>
        )}
      </div>
      <div className="apptinfo">
        <b>
          {a.service}
          {isUrgent && <span className="badge-urgent">URGENT</span>}
        </b>
        <small>
          <Clock3 size={12} /> {a.time} WITA · {dateFmt(a.date)}
        </small>
        <small>{a.studentName}</small>
      </div>
      <span className={'status ' + (a.status || '').toLowerCase()}>{a.status}</span>
    </div>
  );
}
