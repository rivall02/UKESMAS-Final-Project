import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  setDoc,
  documentId,
  runTransaction,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sortByDateTimeDesc } from '../utils/date';
import { CANCELLABLE_STATUSES, DEFAULT_SLOT_CAPACITY, STATUS, TIME_SLOTS } from '../constants';

const col = collection(db, 'appointments');
const settingsRef = doc(db, 'settings', 'app');

function readCapacity(snapshot) {
  const capacity = snapshot.data()?.slotCapacity;
  return Number.isInteger(capacity) && capacity >= 1 && capacity <= 5
    ? capacity
    : DEFAULT_SLOT_CAPACITY;
}

function readCount(snapshot) {
  const count = snapshot.data()?.count;
  return Number.isInteger(count) && count >= 0 ? count : 0;
}

function slotsForDate(date) {
  return query(
    collection(db, 'slots'),
    where(documentId(), '>=', `${date}_`),
    where(documentId(), '<=', `${date}_~`),
  );
}

function readCounts(snapshot, date) {
  return Object.fromEntries(snapshot.docs.map((slot) => [slot.id.slice(date.length + 1), readCount(slot)]));
}

export function subscribeAppointments({ userId, isStaff }, onChange, onError) {
  const q = isStaff ? query(col) : query(col, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => onChange(sortByDateTimeDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError,
  );
}

export async function reserveSlot(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !TIME_SLOTS.includes(time)) {
    throw new Error('Pilih tanggal dan jam layanan yang valid.');
  }
  const slotRef = doc(db, 'slots', `${date}_${time}`);
  return runTransaction(db, async (transaction) => {
    const settings = await transaction.get(settingsRef);
    const slot = await transaction.get(slotRef);
    const count = readCount(slot);
    if (count >= readCapacity(settings)) return false;
    transaction.set(slotRef, { count: count + 1 });
    return true;
  });
}

export async function releaseSlot(date, time) {
  if (!date || !time) return;
  const slotRef = doc(db, 'slots', `${date}_${time}`);
  await runTransaction(db, async (transaction) => {
    const slot = await transaction.get(slotRef);
    if (slot.exists()) transaction.update(slotRef, { count: Math.max(0, readCount(slot) - 1) });
  });
}

export async function getSlotCapacity() {
  return readCapacity(await getDoc(settingsRef));
}

export async function setSlotCapacity(n) {
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error('Kapasitas per slot harus berupa angka bulat 1–5.');
  }
  await setDoc(settingsRef, { slotCapacity: n }, { merge: true });
}

export async function getSlotCounts(date) {
  if (!date) return {};
  return readCounts(await getDocs(slotsForDate(date)), date);
}

export function subscribeSlotCounts(date, onChange, onError) {
  return onSnapshot(slotsForDate(date), (snapshot) => onChange(readCounts(snapshot, date)), onError);
}

export function subscribeSlotCapacity(onChange, onError) {
  return onSnapshot(settingsRef, (snapshot) => onChange(readCapacity(snapshot)), onError);
}

export async function createAppointment(data) {
  const ref = await addDoc(col, { priority: 'normal', ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateAppointment(id, data) {
  await updateDoc(doc(db, 'appointments', id), data);
}

export async function updateAppointmentStatus(id, status) {
  const appointmentRef = doc(db, 'appointments', id);
  if (status === STATUS.DITOLAK) {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(appointmentRef);
      const current = snapshot.data();
      if (!snapshot.exists() || !CANCELLABLE_STATUSES.includes(current.status) || current.priority === 'urgent') {
        throw new Error('Status janji sudah berubah. Muat ulang daftar sebelum menolak janji.');
      }
      transaction.update(appointmentRef, { status });
    });
    return;
  }
  await updateDoc(appointmentRef, { status });
}

export async function deleteAppointment(appointment) {
  const appointmentRef = doc(db, 'appointments', appointment.id);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(appointmentRef);
    if (!snapshot.exists()) return;
    const current = snapshot.data();
    if (!CANCELLABLE_STATUSES.includes(current.status) || current.priority === 'urgent') {
      throw new Error('Status janji sudah berubah. Hanya janji Menunggu atau Terjadwal yang bisa dibatalkan.');
    }
    const slotRef = current.date && current.time ? doc(db, 'slots', `${current.date}_${current.time}`) : null;
    const slot = slotRef ? await transaction.get(slotRef) : null;
    transaction.delete(appointmentRef);
    if (slot?.exists()) transaction.update(slotRef, { count: Math.max(0, readCount(slot) - 1) });
  });
}
