import {
  collection,
  addDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `Kamu adalah UKESMAS Health Buddy, asisten kesehatan untuk mahasiswa Universitas Klabat.

Aturan:
- Jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami.
- Berikan informasi kesehatan umum dan tips menjaga kesehatan.
- Jawab dengan singkat dan terstruktur (maksimal 3–4 paragraf), tanpa tabel.
- Jangan pernah memberikan diagnosis medis atau resep obat.
- Selalu ingatkan pengguna untuk konsultasi ke tenaga medis profesional jika keluhan serius.
- Fokus pada topik: pola tidur, nutrisi, stres, olahraga, kesehatan mental, dan gaya hidup sehat mahasiswa.
- Jika ditanya di luar topik kesehatan, arahkan kembali ke topik kesehatan dengan sopan.

PENTING — Deteksi Urgensi:
Di akhir jawabanmu, SELALU tambahkan baris terakhir dengan format:
[URGENCY:level]
Dimana level adalah:
- LOW = keluhan ringan, tips umum, pertanyaan informasi
- MEDIUM = keluhan yang perlu perhatian tapi tidak darurat
- HIGH = kondisi yang memerlukan penanganan segera, seperti: demam tinggi, sesak napas, nyeri dada, pikiran menyakiti diri sendiri, pikiran bunuh diri, cedera serius, muntah darah, pingsan, kejang, reaksi alergi berat, keracunan

Contoh: jika mahasiswa bilang "saya merasa ingin mengakhiri hidup" → jawab dengan empati dan sumber bantuan, lalu akhiri dengan [URGENCY:HIGH]
Contoh: jika mahasiswa tanya "tips tidur nyenyak" → jawab tips, lalu akhiri dengan [URGENCY:LOW]`;

async function callModel(model, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        reasoning_effort: 'low',
        max_completion_tokens: 1500,
        temperature: 0.6,
        messages,
      }),
    });

    if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('Respons kosong');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function askAI(messages) {
  const messageList = Array.isArray(messages)
    ? messages
    : [{ role: 'user', content: String(messages || '') }];

  const payload = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messageList.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    })),
  ];

  let lastError;
  for (const model of MODELS) {
    try {
      return parseResponse(await callModel(model, payload));
    } catch (err) {
      console.warn(`${model} gagal:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

function parseResponse(text) {
  const pattern = /\[URGENCY:\s*(LOW|MEDIUM|HIGH)\]\s*$/i;
  const match = text.match(pattern);
  const urgency = match ? match[1].toUpperCase() : 'LOW';
  const cleanText = text.replace(pattern, '').trim();

  return { text: cleanText, urgency, isUrgent: urgency === 'HIGH' };
}

export function subscribeChat(uid, cb, onError) {
  if (!uid) return () => {};
  const colRef = collection(db, 'aiChats', uid, 'messages');
  const q = query(colRef, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cb(list);
    },
    onError,
  );
}

export async function addChatMessage(uid, { role, content, urgency = null }) {
  if (!uid) return;
  const colRef = collection(db, 'aiChats', uid, 'messages');
  await addDoc(colRef, {
    role,
    content,
    urgency: urgency || null,
    createdAt: new Date().toISOString(),
  });
}

export async function clearChat(uid) {
  if (!uid) return;
  const colRef = collection(db, 'aiChats', uid, 'messages');
  const snap = await getDocs(colRef);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
}
