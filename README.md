# UKESMAS — Final Project Front-End

Prototype layanan kesehatan mahasiswa Universitas Klabat menggunakan React, Vite, dan JSON Server.

## Fitur
- Landing page publik: Tentang, Layanan, Manfaat.
- Login dan register mahasiswa.
- Dashboard mahasiswa dan dashboard admin.
- Booking janji temu dan status booking.
- Admin menyetujui, menolak, atau menyelesaikan janji temu.
- Rekam medis mahasiswa; admin dapat menambahkan catatan.
- Manajemen data mahasiswa oleh admin.
- Artikel edukasi kesehatan.
- Konsultasi AI simulasi (belum terhubung model AI sungguhan).

## Instalasi
Pastikan Node.js LTS sudah terpasang. Buka folder ini di VS Code lalu jalankan:

```bash
npm install
```

Buka **dua terminal** di VS Code.

Terminal 1 — jalankan database demo:
```bash
npm run server
```
JSON Server aktif di `http://localhost:3001`.

Terminal 2 — jalankan React:
```bash
npm run dev
```
Buka alamat Vite yang tampil, biasanya `http://localhost:5173`.

## Akun demo
- Mahasiswa: `student@unklab.ac.id` / `123456`
- Admin: `admin@unklab.ac.id` / `admin123`

## Endpoint
- `/users` — data akun
- `/appointments` — jadwal konsultasi
- `/records` — catatan pemeriksaan
- `/articles` — edukasi kesehatan

## Catatan keamanan dan batasan
Ini adalah prototype akademik dengan data dummy. Password pada JSON Server disimpan sebagai teks biasa dan TIDAK aman untuk produksi. Jangan memasukkan data kesehatan asli. Untuk penggunaan nyata diperlukan backend aman, autentikasi dan otorisasi yang benar, enkripsi, audit log, persetujuan pengguna, serta perlindungan data kesehatan. Fitur AI saat ini menggunakan jawaban simulasi statis, bukan Gemini atau diagnosis medis.
