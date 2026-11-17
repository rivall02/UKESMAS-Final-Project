import { Clock3, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/date';

export default function AppointmentCard({ a }) {
  const isUrgent = a.priority === 'urgent';
  const day = a.date ? new Date(a.date + 'T00:00:00') : null;

  return (
    <div className={isUrgent ? 'appt appt-urgent' : 'appt'}>
      <div className={isUrgent ? 'cal cal-urgent' : 'cal'}>
        {isUrgent || !day ? (
          <AlertTriangle size={18} />
        ) : (
          <>
            <b>{day.getDate()}</b>
            <small>{day.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}</small>
          </>
        )}
      </div>
      <div className="apptinfo">
        <b>
          {a.service}
          {isUrgent && <span className="badge-urgent">URGENT</span>}
        </b>
        <small>
          <Clock3 size={12} /> {a.time} WITA · {formatDate(a.date)}
        </small>
        <small>{a.studentName}</small>
      </div>
      <span className={'status ' + (a.status || '').toLowerCase()}>{a.status}</span>
    </div>
  );
}
