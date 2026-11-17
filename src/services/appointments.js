import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sortByDateTimeDesc } from '../utils/date';

const col = collection(db, 'appointments');

export function subscribeAppointments({ userId, isStaff }, onChange, onError) {
  const q = isStaff ? query(col) : query(col, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => onChange(sortByDateTimeDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError,
  );
}

export async function reserveSlot() {
  return true;
}

export async function releaseSlot() {}

export async function createAppointment(data) {
  const ref = await addDoc(col, { priority: 'normal', ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateAppointment(id, data) {
  await updateDoc(doc(db, 'appointments', id), data);
}

export async function updateAppointmentStatus(id, status) {
  await updateDoc(doc(db, 'appointments', id), { status });
}

export async function deleteAppointment(appointment) {
  await deleteDoc(doc(db, 'appointments', appointment.id));
  await releaseSlot(appointment.date, appointment.time);
}
