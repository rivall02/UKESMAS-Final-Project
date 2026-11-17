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

async function callModel(model, question) {
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
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
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

export async function askAI(question) {
  let lastError;
  for (const model of MODELS) {
    try {
      return parseResponse(await callModel(model, question));
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
  const cleanText = text.replace(pattern, '').replace(/\*\*/g, '').trim();

  return { text: cleanText, urgency, isUrgent: urgency === 'HIGH' };
}
