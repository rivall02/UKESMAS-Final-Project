import { useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ROLES, STAFF_ROLES } from '../constants';
import { getUser, upsertDirectory } from '../services/users';
import { AuthContext } from './auth';

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (busy.current) return;
        if (!firebaseUser) {
          setProfile(null);
          setLoading(false);
          return;
        }
        try {
          const p = await getUser(firebaseUser.uid);
          if (!p || p.disabled) {
            await signOut(auth);
            setProfile(null);
          } else {
            setProfile(p);
          }
        } catch (err) {
          console.error('Gagal memuat profil:', err);
          setProfile(null);
        }
        setLoading(false);
      }),
    [],
  );

  async function login(email, password, portal) {
    busy.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const p = await getUser(cred.user.uid);
      const staffAccount = p && STAFF_ROLES.includes(p.role);
      let error = '';
      if (!p) error = 'Data akun tidak ditemukan. Hubungi petugas UKESMAS.';
      else if (p.disabled) error = 'Akun ini dinonaktifkan. Hubungi petugas UKESMAS.';
      else if (portal === 'student' && staffAccount) error = 'Ini akun staff. Silakan masuk lewat tab Staff/Admin.';
      else if (portal === 'staff' && !staffAccount) error = 'Ini akun mahasiswa. Silakan masuk lewat tab Mahasiswa.';
      if (error) {
        await signOut(auth);
        throw new Error(error);
      }
      if (p.role === ROLES.STUDENT) await upsertDirectory(p.id, p);
      setProfile(p);
      return p;
    } finally {
      busy.current = false;
    }
  }

  async function register({ name, email, password, nim, faculty, program }) {
    busy.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const userData = {
        name,
        email,
        role: ROLES.STUDENT,
        nim,
        faculty,
        program,
        disabled: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), userData);
      await upsertDirectory(cred.user.uid, userData);
      const p = { id: cred.user.uid, ...userData };
      setProfile(p);
      return p;
    } finally {
      busy.current = false;
    }
  }

  async function logout() {
    await signOut(auth);
    setProfile(null);
  }

  function refreshProfile(data) {
    setProfile((prev) => ({ ...prev, ...data }));
  }

  const role = profile?.role;
  const value = {
    profile,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    role,
    isStudent: role === ROLES.STUDENT,
    isStaff: STAFF_ROLES.includes(role),
    isAdmin: role === ROLES.ADMIN,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
