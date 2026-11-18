import { collection, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ACTIVE_EMERGENCY_STATUSES, STATUS } from '../constants';
import { sortByDateTimeDesc } from '../utils/date';
import { notifyStatusChange } from './notifications';

export function subscribeActiveEmergencies(onChange, onError) {
  const q = query(collection(db, 'appointments'), where('priority', '==', 'urgent'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => ACTIVE_EMERGENCY_STATUSES.includes(a.status));
      onChange(sortByDateTimeDesc(list));
    },
    onError,
  );
}

export async function setEmergencyStatus(appointment, status, staff) {
  await updateDoc(doc(db, 'appointments', appointment.id), {
    status,
    handledBy: staff ? { id: staff.id, name: staff.name } : null,
  });
  await notifyStatusChange(appointment, status);
}

export async function referEmergency(appointment, hospitalName, staff) {
  await updateDoc(doc(db, 'appointments', appointment.id), {
    status: STATUS.DIRUJUK,
    referral: {
      hospital: hospitalName,
      at: new Date().toISOString(),
    },
    handledBy: staff ? { id: staff.id, name: staff.name } : null,
  });
  await notifyStatusChange(appointment, STATUS.DIRUJUK);
}
