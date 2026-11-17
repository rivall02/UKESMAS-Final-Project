import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';
import { ROLES, STAFF_ROLES } from '../constants';

const usersCol = collection(db, 'users');
const directoryCol = collection(db, 'directory');

export async function getUser(id) {
  const snap = await getDoc(doc(db, 'users', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUser(id, data) {
  await updateDoc(doc(db, 'users', id), data);
}

export async function setUserDisabled(id, disabled) {
  await updateDoc(doc(db, 'users', id), { disabled });
}

function subscribeByRoles(roles, onChange, onError) {
  const q = query(usersCol, where('role', 'in', roles));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export function subscribeStudents(onChange, onError) {
  return subscribeByRoles([ROLES.STUDENT], onChange, onError);
}

export function subscribeStaff(onChange, onError) {
  return subscribeByRoles(STAFF_ROLES, onChange, onError);
}

export async function countStudents() {
  const snap = await getDocs(query(usersCol, where('role', '==', ROLES.STUDENT)));
  return snap.size;
}

export async function upsertDirectory(uid, { name, nim }) {
  await setDoc(doc(db, 'directory', uid), { name: name || '', nim: nim || '' });
}

export async function searchDirectory(term) {
  const q = term.trim().toLowerCase();
  if (q.length < 2) return [];
  const snap = await getDocs(directoryCol);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((x) => x.name.toLowerCase().includes(q) || x.nim.includes(q))
    .slice(0, 10);
}

export async function createStaffAccount({ name, staffCode, role, phone, email, password }) {
  const secondary = initializeApp(firebaseConfig, `staff-creator-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      staffCode,
      role,
      phone,
      email,
      disabled: false,
      createdAt: new Date().toISOString(),
    });
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}

export async function updateStaffAccount(id, { name, staffCode, role, phone }) {
  await updateDoc(doc(db, 'users', id), { name, staffCode, role, phone });
}

export async function sendStaffPasswordReset(email) {
  const secondary = initializeApp(firebaseConfig, `staff-reset-${Date.now()}`);
  try {
    await sendPasswordResetEmail(getAuth(secondary), email);
  } finally {
    await deleteApp(secondary);
  }
}
