import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CANCELLABLE_STATUSES, MERGE_WINDOW, STATUS } from '../constants';
import { nowTimeWITA, todayWITA, toMinutes } from '../utils/date';
import { releaseSlot } from './appointments';

const col = collection(db, 'appointments');

async function findMergeableAppointment(userId, date, time) {
  const snap = await getDocs(query(col, where('userId', '==', userId)));
  const now = toMinutes(time);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .find((a) => {
      if (a.date !== date || a.priority === 'urgent' || !CANCELLABLE_STATUSES.includes(a.status)) return false;
      const diff = toMinutes(a.time) - now;
      return diff >= -MERGE_WINDOW.beforeMinutes && diff <= MERGE_WINDOW.afterMinutes;
    });
}

export async function createEmergency({
  reporter,
  victimType = 'self',
  victim = null,
  description = '',
  location = null,
  locationDetail = '',
  ambulanceRequested = false,
  source = 'sos',
  aiSummary = '',
}) {
  const date = todayWITA();
  const time = nowTimeWITA();
  const patient = victimType === 'self' ? { id: reporter.id, name: reporter.name, nim: reporter.nim } : victim;

  const emergencyFields = {
    priority: 'urgent',
    status: STATUS.URGENT,
    date,
    time,
    reporterId: reporter.id,
    reporterName: reporter.name || '',
    victimType,
    location,
    locationDetail,
    emergencyNote: description,
    ambulanceRequested,
    source,
    aiSummary,
    referral: null,
  };

  if (victimType === 'self') {
    const existing = await findMergeableAppointment(reporter.id, date, time);
    if (existing) {
      await updateDoc(doc(db, 'appointments', existing.id), {
        ...emergencyFields,
        mergedFrom: { service: existing.service, time: existing.time, note: existing.note || '' },
      });
      await releaseSlot(existing.date, existing.time);
      return { id: existing.id, merged: true };
    }
  }

  const ref = await addDoc(col, {
    ...emergencyFields,
    userId: patient?.id || null,
    studentName: patient?.name || 'Bukan mahasiswa',
    nim: patient?.nim || '',
    service: 'Konsultasi Darurat',
    note: description,
    mergedFrom: null,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, merged: false };
}

export async function updateEmergencyDetails(id, { emergencyNote, locationDetail, location, ambulanceRequested } = {}) {
  const updates = {};
  if (emergencyNote !== undefined) updates.emergencyNote = emergencyNote;
  if (locationDetail !== undefined) updates.locationDetail = locationDetail;
  if (location !== undefined) updates.location = location;
  if (ambulanceRequested !== undefined) updates.ambulanceRequested = ambulanceRequested;

  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'appointments', id), updates);
  }
}

export function subscribeEmergency(id, onChange, onError) {
  return onSnapshot(
    doc(db, 'appointments', id),
    (snap) => {
      if (snap.exists()) {
        onChange({ id: snap.id, ...snap.data() });
      } else {
        onChange(null);
      }
    },
    onError,
  );
}

export function getCurrentLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

