import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function getArticles() {
  const snap = await getDocs(collection(db, 'articles'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
