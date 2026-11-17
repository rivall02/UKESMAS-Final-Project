import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/firestore';

export default function NotificationBell() {
  const { profile, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  if (isAdmin) return null;

  async function load() {
    if (!profile) return;
    try {
      const data = await getNotifications(profile.id);
      setNotifications(data);
    } catch (err) {
      console.error('Gagal memuat notifikasi:', err);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.read);

  async function handleRead(n) {
    if (!n.read) {
      await markNotificationRead(n.id);
      load();
    }
  }

  async function handleReadAll() {
    await markAllNotificationsRead(profile.id);
    load();
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(!open)}>
        <Bell size={16} />
        {unread.length > 0 && <span className="notif-badge">{unread.length}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <b>Notifikasi</b>
            {unread.length > 0 && (
              <button className="notif-readall" onClick={handleReadAll}>
                <Check size={10} /> Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">Belum ada notifikasi.</div>
            )}
            {notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                className={'notif-item' + (n.read ? '' : ' unread')}
                onClick={() => handleRead(n)}
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

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}
