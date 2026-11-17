import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// --- Appointments ---

export async function getAppointments(userId, isAdmin) {
  const ref = collection(db, 'appointments');
  const q = isAdmin ? query(ref) : query(ref, where('userId', '==', userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function createAppointment(data) {
  const ref = collection(db, 'appointments');
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function updateAppointmentStatus(id, status) {
  await updateDoc(doc(db, 'appointments', id), { status });
}

export async function updateAppointment(id, data) {
  await updateDoc(doc(db, 'appointments', id), data);
}

// --- Records ---

export async function getRecords(userId, isAdmin) {
  const ref = collection(db, 'records');
  const q = isAdmin ? query(ref) : query(ref, where('userId', '==', userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function createRecord(data) {
  const ref = collection(db, 'records');
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

// --- Articles ---

export async function getArticles() {
  const ref = collection(db, 'articles');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- Users ---

export async function getUsers() {
  const ref = collection(db, 'users');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUser(id) {
  const snap = await getDoc(doc(db, 'users', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUser(id, data) {
  await updateDoc(doc(db, 'users', id), data);
}

export async function deleteUser(id) {
  await deleteDoc(doc(db, 'users', id));
}

// --- Notifications ---

export async function getNotifications(userId) {
  const ref = collection(db, 'notifications');
  const q = query(ref, where('userId', '==', userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function createNotification(data) {
  const ref = collection(db, 'notifications');
  await addDoc(ref, { ...data, read: false, createdAt: new Date().toISOString() });
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

export async function markAllNotificationsRead(userId) {
  const ref = collection(db, 'notifications');
  const q = query(ref, where('userId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  const updates = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);
}
