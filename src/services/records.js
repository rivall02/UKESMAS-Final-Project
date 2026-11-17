import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sortByDateTimeDesc } from '../utils/date';

const col = collection(db, 'records');

export function subscribeRecords({ userId, isStaff }, onChange, onError) {
  const q = isStaff ? query(col) : query(col, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => onChange(sortByDateTimeDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError,
  );
}

export async function createRecord(data) {
  const ref = await addDoc(col, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}
