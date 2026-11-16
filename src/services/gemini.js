import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `Kamu adalah UKESMAS Health Buddy, asisten kesehatan untuk mahasiswa Universitas Klabat.

Aturan:
- Jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami.
- Berikan informasi kesehatan umum dan tips menjaga kesehatan.
- Jawab dengan singkat dan terstruktur (maksimal 3–4 paragraf).
- Jangan pernah memberikan diagnosis medis atau resep obat.
- Selalu ingatkan pengguna untuk konsultasi ke tenaga medis profesional jika keluhan serius.
- Fokus pada topik: pola tidur, nutrisi, stres, olahraga, kesehatan mental, dan gaya hidup sehat mahasiswa.
- Jika ditanya di luar topik kesehatan, arahkan kembali ke topik kesehatan dengan sopan.`;

export async function askGemini(question) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: 'Siapa kamu?' }] },
      {
        role: 'model',
        parts: [
          {
            text: 'Halo! Saya UKESMAS Health Buddy, asisten informasi kesehatan untuk mahasiswa Universitas Klabat. Saya bisa membantu kamu dengan tips kesehatan umum, informasi pola hidup sehat, dan saran ringan seputar kesehatan. Perlu diingat, saya bukan pengganti dokter ya! 😊',
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await chat.sendMessage(question);
  return result.response.text();
}
