import { X, CalendarDays } from 'lucide-react';

export default function Modal({ title, close, children }) {
  return (
    <div className="backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close}><X /></button>
        <div className="modalicon"><CalendarDays /></div>
        <h2>{title}</h2>
        {children}
        <small className="disclaimer">UKESMAS · Prototype akademik</small>
      </div>
    </div>
  );
}
