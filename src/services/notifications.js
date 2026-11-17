import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const col = collection(db, 'notifications');

export function subscribeNotifications(userId, onChange, onError) {
  return onSnapshot(
    query(col, where('userId', '==', userId)),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    },
    onError,
  );
}

export async function createNotification({ userId, title, message, type = 'appointment', appointmentId = null }) {
  if (!userId) return;
  await addDoc(col, {
    userId,
    title,
    message,
    type,
    appointmentId,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

export async function markAllNotificationsRead(notifications) {
  await Promise.all(notifications.filter((n) => !n.read).map((n) => markNotificationRead(n.id)));
}

const STATUS_MESSAGES = {
  Terjadwal: 'Janji temu kamu telah disetujui dan dijadwalkan.',
  Selesai: 'Janji temu kamu telah selesai.',
  Ditolak: 'Janji temu kamu ditolak. Silakan buat janji baru.',
  Ditangani: 'Laporan darurat kamu sedang ditangani petugas.',
  Dirujuk: 'Kamu dirujuk ke rumah sakit. Ikuti arahan petugas UKESMAS.',
};

export async function notifyStatusChange(appointment, status) {
  const message = STATUS_MESSAGES[status];
  if (!message || !appointment.userId) return;
  await createNotification({
    userId: appointment.userId,
    title: `Status janji temu: ${status}`,
    message,
    appointmentId: appointment.id,
  });
}
