import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(
    () =>
      subscribeNotifications(profile.id, setNotifications, (err) =>
        console.error('Gagal memuat notifikasi:', err),
      ),
    [profile.id],
  );

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(!open)} title="Notifikasi">
        <Bell size={16} />
        {unread.length > 0 && <span className="notif-badge">{unread.length}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <b>Notifikasi</b>
            {unread.length > 0 && (
              <button className="notif-readall" onClick={() => markAllNotificationsRead(notifications)}>
                <Check size={10} /> Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 && <div className="notif-empty">Belum ada notifikasi.</div>}
            {notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                className={'notif-item' + (n.read ? '' : ' unread')}
                onClick={() => !n.read && markNotificationRead(n.id)}
              >
                <div className="notif-icon">
                  <CalendarDays size={14} />
                </div>
                <div className="notif-content">
                  <b>{n.title}</b>
                  <p>{n.message}</p>
                  <small>{timeAgo(n.createdAt)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
