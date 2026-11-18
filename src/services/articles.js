import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { todayWITA } from '../utils/date';

const articlesCol = collection(db, 'articles');

function normalizeArticle(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    isTip: Boolean(data.isTip),
    tipDate: data.tipDate || null,
  };
}

export async function getArticles() {
  const snap = await getDocs(articlesCol);
  return snap.docs.map(normalizeArticle);
}

export function subscribeArticles(onChange, onError) {
  return onSnapshot(
    articlesCol,
    (snap) => {
      const list = snap.docs.map(normalizeArticle);
      onChange(list);
    },
    onError,
  );
}

export async function createArticle(data) {
  const payload = {
    title: data.title || '',
    category: data.category || 'Umum',
    emoji: data.emoji || '🌷',
    description: data.description || '',
    body: data.body || '',
    isTip: Boolean(data.isTip),
    tipDate: data.isTip ? data.tipDate || todayWITA() : null,
    createdBy: data.createdBy || { id: '', name: '' },
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(articlesCol, payload);
  return docRef.id;
}

export async function updateArticle(id, data) {
  const payload = { ...data };
  if ('isTip' in payload) {
    payload.isTip = Boolean(payload.isTip);
    if (!payload.isTip) {
      payload.tipDate = null;
    }
  }
  await updateDoc(doc(db, 'articles', id), payload);
}

export async function deleteArticle(id) {
  await deleteDoc(doc(db, 'articles', id));
}

export async function getDailyTip() {
  const list = await getArticles();
  const today = todayWITA();
  const tips = list.filter((a) => a.isTip && (!a.tipDate || a.tipDate <= today));
  if (tips.length === 0) return null;

  const todayTip = tips.find((a) => a.tipDate === today);
  if (todayTip) return todayTip;

  const sorted = [...tips].sort((a, b) => {
    const dateComp = (b.tipDate || '').localeCompare(a.tipDate || '');
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return sorted[0] || null;
}
