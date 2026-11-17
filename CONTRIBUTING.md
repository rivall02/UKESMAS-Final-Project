# Panduan Kolaborasi Tim UKESMAS

Baca sampai habis sebelum mulai. Panduan ini menjaga agar 6 orang bisa bekerja **bersamaan** tanpa saling merusak kode.

## Aturan emas

1. **Jangan pernah push langsung ke `master`.** Semua perubahan lewat Pull Request (PR).
2. **Satu tugas = satu branch.**
3. **Ubah hanya file milikmu.** Lihat tabel di [`docs/KONTRAK-DATA.md`](docs/KONTRAK-DATA.md#4-pembagian-file-siapa-boleh-mengubah-apa).
4. **Jangan `npm install <paket-baru>`.** Minta ke ketua.
5. **Jangan commit file `.env`.** Isinya rahasia dan dibagikan lewat grup WA.
6. **Wajib lulus `npm run lint` dan `npm run build`** sebelum membuat PR.

---

## 1. Persiapan (sekali saja)

```bash
git clone https://github.com/rivall02/UKESMAS-Final-Project.git
cd UKESMAS-Final-Project
npm install
```

Buat file `.env` di folder utama (isinya minta ke ketua di grup WA), lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173`. Akun uji coba juga minta ke ketua.

Atur identitas git (pakai nama & email akun GitHub kamu):

```bash
git config user.name "Nama Kamu"
git config user.email "email-github@contoh.com"
```

## 2. Mulai mengerjakan tugas

```bash
git checkout master
git pull origin master
git checkout -b fitur/nama-fitur
```

Nama branch sesuai issue kamu, contoh: `fitur/janji-temu`, `fitur/kalender`, `fitur/sos`, `fitur/darurat-staff`, `fitur/profil-edukasi`.

## 3. Selama bekerja: commit kecil dan sering

```bash
git add src/pages/Sos.jsx src/styles/sos.css
git commit -m "Tambah form SOS untuk orang lain"
git push -u origin fitur/sos
```

- `git add` **sebutkan file satu per satu**. Hindari `git add .` supaya file yang tidak sengaja berubah tidak ikut.
- Pesan commit: kalimat singkat bahasa Indonesia yang menjelaskan **apa** yang berubah.
- Push setiap selesai satu bagian supaya pekerjaanmu aman di GitHub.

## 4. Setiap hari sebelum lanjut kerja: ambil update terbaru

Teman-temanmu juga sedang merge ke `master`. Tarik perubahan mereka ke branch-mu:

```bash
git checkout master
git pull origin master
git checkout fitur/sos
git merge master
```

Makin sering kamu melakukan ini, makin kecil kemungkinan konflik besar.

## 5. Kalau terjadi konflik

Git akan bilang `CONFLICT (content): Merge conflict in <file>`. Buka file itu, cari tanda:

```
<<<<<<< HEAD
kode versi kamu
=======
kode versi master
>>>>>>> master
```

1. Pilih atau gabungkan kode yang benar, lalu **hapus ketiga baris penanda** (`<<<<<<<`, `=======`, `>>>>>>>`).
2. Simpan, lalu:
   ```bash
   npm run lint
   npm run build
   git add <file-yang-konflik>
   git commit -m "Selesaikan konflik dengan master"
   git push
   ```
3. Kalau konfliknya di file milik orang lain atau kamu ragu, **berhenti dan tanya di grup**. Jangan asal pilih.

Batal merge kalau bingung (kembali ke kondisi sebelum merge):

```bash
git merge --abort
```

## 6. Sebelum membuat Pull Request

```bash
git checkout master && git pull origin master
git checkout fitur/sos && git merge master
npm run lint
npm run build
```

Keduanya harus **tanpa error**. Lalu coba fiturmu di browser dengan akun mahasiswa **dan** akun staff.

## 7. Membuat Pull Request

1. Push branch-mu: `git push`.
2. Buka repo di GitHub → **Compare & pull request**.
3. Base: `master`, compare: branch-mu.
4. Isi template PR (apa yang diubah, cara mengetes, screenshot).
5. Di deskripsi tulis `Closes #<nomor-issue>` agar issue otomatis tertutup saat PR di-merge.
6. Tunggu **cek otomatis (CI) hijau** dan review dari ketua.
7. Kalau ketua minta perbaikan: ubah di branch yang sama, commit, push. PR akan ter-update sendiri.

PR boleh dibuat lebih dari sekali per tugas. **PR kecil lebih cepat di-review** dan lebih jarang konflik.

## 8. Setelah PR di-merge

```bash
git checkout master
git pull origin master
git branch -d fitur/sos
```

Untuk tugas lanjutan, buat branch baru dari `master` yang terbaru.

---

## Memakai prompt AI dari issue

Setiap issue berisi **prompt lengkap** yang bisa ditempel ke asisten AI (Claude Code, Cursor, dll.) yang dijalankan **di dalam folder project ini**.

- Selalu baca ulang kode yang dihasilkan AI. Kamu yang bertanggung jawab atas PR-mu.
- Kalau AI mengubah file di luar daftar milikmu, **batalkan perubahan itu** (`git checkout -- <file>`).
- Kalau AI ingin menginstal library, tolak dan diskusikan dengan ketua.
- Jangan tempel isi `.env` atau password ke AI.

## Deploy

Hanya **ketua** yang deploy ke Firebase (`firebase deploy`). Anggota cukup mengetes di `npm run dev`.

## Ringkasan perintah

| Situasi | Perintah |
|---|---|
| Mulai tugas | `git checkout master && git pull && git checkout -b fitur/x` |
| Simpan pekerjaan | `git add <file> && git commit -m "..." && git push` |
| Ambil update tim | `git checkout master && git pull && git checkout fitur/x && git merge master` |
| Cek sebelum PR | `npm run lint && npm run build` |
| Batal merge | `git merge --abort` |
| Buang perubahan 1 file | `git checkout -- <file>` |
