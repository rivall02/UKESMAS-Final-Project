# UKESMAS — Sistem Layanan Kesehatan Mahasiswa Universitas Klabat

Aplikasi web untuk layanan kesehatan mahasiswa: janji temu, rekam medis, edukasi kesehatan, konsultasi AI, dan laporan darurat (SOS).

**Live:** https://ukesmas-5da4f.web.app

## Teknologi

- React 18 + Vite (JSX, tanpa TypeScript)
- Firebase Authentication & Cloud Firestore (paket gratis Spark)
- Firebase Hosting
- Groq API (model GPT-OSS) untuk Konsultasi AI
- ESLint

## Role

| Role | Akses |
|---|---|
| Mahasiswa | Janji temu, rekam medis sendiri, edukasi, Konsultasi AI, SOS, profil |
| Staff | Kelola janji temu & darurat, input rekam medis, edukasi, lihat data mahasiswa |
| Head Admin | Semua akses staff + kelola akun mahasiswa & staff |

Mahasiswa mendaftar sendiri (`@student.unklab.ac.id`). Akun staff (`@unklab.ac.id`) dibuat oleh Head Admin di menu **Kelola Staff**.

## Menjalankan di komputer sendiri

Butuh Node.js 24 atau lebih baru.

```bash
npm install
cp .env.example .env   # lalu isi nilainya (minta ke ketua)
npm run dev
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan di `http://localhost:5173` |
| `npm run lint` | Cek kualitas kode |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Coba hasil build |

## Struktur folder

```
src/
  components/   komponen yang dipakai ulang
  contexts/     state login & role (useAuth)
  pages/        satu file per halaman
  services/     akses Firestore & AI, dipisah per area
  styles/       CSS per fitur
  utils/        tanggal WITA, kalender
  constants.js  data tetap: fakultas, slot jam, status, RS rujukan
firestore.rules aturan keamanan database
docs/           kontrak data & pembagian file tim
```

## Untuk anggota tim

Baca [CONTRIBUTING.md](CONTRIBUTING.md) dan [docs/KONTRAK-DATA.md](docs/KONTRAK-DATA.md) sebelum mulai.

## Deploy (khusus ketua)

```bash
npm run build
npx firebase deploy --only hosting,firestore:rules
```
