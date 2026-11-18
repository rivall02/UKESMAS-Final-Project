import { Clock3, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/date';
import '../styles/appointments.css';

export default function AppointmentCard({ a }) {
  const isUrgent = a.priority === 'urgent';
  const dateLabel = formatDate(a.date);

  return (
    <div className={`appt appt-card${isUrgent ? ' appt-urgent' : ''}`}>
      <div className={isUrgent ? 'cal cal-urgent' : 'cal'}>
        {isUrgent || !a.date ? (
          <AlertTriangle size={18} />
        ) : (
          <>
            <b>{Number(a.date.slice(8, 10))}</b>
            <small>{dateLabel.split(' ')[1]?.slice(0, 3).toUpperCase()}</small>
          </>
        )}
      </div>
      <div className="apptinfo appt-card-info">
        <b>
          {a.service}
          {isUrgent && <span className="badge-urgent">URGENT</span>}
        </b>
        <small>
          <Clock3 size={12} /> {a.time} WITA · {dateLabel}
        </small>
        <small>{a.studentName}</small>
        {a.mergedFrom && <small className="appt-merged">Digabung dari janji jam {a.mergedFrom.time || '-'}</small>}
      </div>
      <span className={'status ' + (a.status || '').toLowerCase()}>{a.status}</span>
    </div>
  );
}
