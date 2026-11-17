# Kontrak Data & Pembagian File

Dokumen ini adalah **kesepakatan bersama**. Semua anggota bekerja paralel, jadi bentuk data dan nama fungsi di bawah **tidak boleh diubah sepihak**. Kalau perlu mengubah, diskusikan dulu di grup lalu ketua yang memperbarui dokumen ini.

---

## 1. Role

| Role | Nilai `role` | Akses |
|---|---|---|
| Mahasiswa | `student` | Data miliknya sendiri, SOS, Konsultasi AI |
| Staff | `staff` | Semua layanan kesehatan, **lihat** data mahasiswa, **tidak bisa** kelola akun |
| Head Admin | `admin` | Semua akses staff + kelola akun mahasiswa & staff |

Di kode gunakan `useAuth()` dari `src/contexts/auth.js`:
`profile`, `role`, `isStudent`, `isStaff` (staff **atau** admin), `isAdmin` (hanya head admin).

> Hak akses dijaga oleh `firestore.rules`. Menyembunyikan tombol di UI saja **tidak cukup**.

---

## 2. Koleksi Firestore

### `users/{uid}`
| Field | Tipe | Keterangan |
|---|---|---|
| `name` | string | |
| `email` | string | Tidak bisa diubah sendiri |
| `role` | `'student' \| 'staff' \| 'admin'` | Tidak bisa diubah sendiri |
| `disabled` | boolean | `true` = akun nonaktif, tidak bisa login |
| `nim`, `faculty`, `program` | string | Mahasiswa |
| `staffCode`, `phone` | string | Staff/admin. `phone` = nomor WA |
| `photo` | string (data URL) | Foto profil terkompresi, **maks ±150 KB** |
| `bio` | string | Maks 300 karakter |
| `createdAt` | ISO string | |

### `directory/{uid}`
Hanya `{ name, nim }` mahasiswa. Dipakai untuk mencari korban SOS tanpa membuka data lengkap mahasiswa lain. Diperbarui otomatis saat mahasiswa daftar, login, atau mengubah profil.

### `appointments/{id}`
Janji temu biasa **dan** laporan darurat ada di koleksi yang sama.

| Field | Tipe | Keterangan |
|---|---|---|
| `userId` | string \| null | **Pasien** (pemilik). `null` jika korban bukan mahasiswa |
| `studentName`, `nim` | string | Data pasien |
| `service` | string | Lihat `SERVICES` di `src/constants.js` |
| `date` | `'YYYY-MM-DD'` | Tanggal **WITA** — pakai `todayWITA()` |
| `time` | `'HH:mm'` | Jam **WITA** — pakai `nowTimeWITA()` atau `TIME_SLOTS` |
| `note` | string | |
| `status` | lihat `STATUS` | |
| `priority` | `'normal' \| 'urgent'` | |
| `createdAt` | serverTimestamp | |

Field tambahan khusus darurat (`priority: 'urgent'`):

| Field | Tipe | Keterangan |
|---|---|---|
| `reporterId`, `reporterName` | string | Pelapor (bisa beda dengan pasien) |
| `victimType` | `'self' \| 'student' \| 'external'` | |
| `location` | `{ lat, lng, accuracy } \| null` | Dari GPS |
| `locationDetail` | string | Contoh: "Asrama Putra lt. 2 kamar 204" |
| `emergencyNote` | string | Penjelasan singkat |
| `ambulanceRequested` | boolean | |
| `source` | `'sos' \| 'ai'` | |
| `aiSummary` | string | |
| `referral` | `{ hospital, at } \| null` | Diisi staff saat merujuk ke RS |
| `mergedFrom` | `{ service, time, note } \| null` | Janji lama yang digabung |
| `handledBy` | `{ id, name } \| null` | Staff yang menangani |

**Alur status**

```
Janji biasa : Menunggu → Terjadwal → Selesai
                       ↘ Ditolak
Darurat     : Urgent → Ditangani → Selesai
                    ↘ Dirujuk (ke RS / ambulans)
```

Mahasiswa **membatalkan** janji = dokumen **dihapus** (hanya status Menunggu/Terjadwal).

Selama status masih `Urgent`, **pelapor** boleh melengkapi `emergencyNote`, `locationDetail`, `location`, dan `ambulanceRequested` setelah SOS terkirim.

**Gabung ke darurat:** saat SOS untuk diri sendiri, janji hari yang sama berstatus Menunggu/Terjadwal yang jamnya antara 30 menit sebelum s/d 60 menit sesudah SOS diubah menjadi darurat (bukan dokumen baru). Sudah ditangani `createEmergency()`.

**AI → SOS:** jika Konsultasi AI mendeteksi `HIGH`, halaman AI membuka halaman SOS dengan:

```js
navigate('/sos', { state: { description, aiSummary, source: 'ai' } });
```

Halaman SOS wajib membaca `useLocation().state` dan mengisi form dengan data tersebut.

### `slots/{YYYY-MM-DD_HH:mm}`
`{ count: number }`, yaitu jumlah janji aktif di slot itu. Dikelola oleh `reserveSlot` / `releaseSlot`.

### `settings/app`
`{ slotCapacity: number }`, default `DEFAULT_SLOT_CAPACITY` (1). Hanya Head Admin yang bisa mengubah.

### `records/{id}`
`userId, studentName, nim, date, time, service, summary, provider, providerId, appointmentId?, createdAt`

### `articles/{id}`
`title, category, emoji, description, body, isTip (boolean), tipDate ('YYYY-MM-DD' | null), createdBy, createdAt`
Tips harian = artikel dengan `isTip: true`.

### `notifications/{id}`
`userId, title, message, type, appointmentId, read, createdAt`. Buat lewat `createNotification()` / `notifyStatusChange()`.

### `aiChats/{uid}/messages/{id}`
`role ('user' | 'assistant'), content, urgency?, createdAt`. Hanya bisa dibaca pemiliknya.

---

## 3. Fungsi bersama (jangan ubah signature-nya)

| Fungsi | File | Pemilik | Dipakai oleh |
|---|---|---|---|
| `todayWITA()`, `nowTimeWITA()`, `toMinutes()`, `formatDate()`, `formatDayHeader()`, `groupByDate()` | `src/utils/date.js` | Ketua | Semua |
| `reserveSlot(date, time)` → `Promise<boolean>`, `releaseSlot(date, time)` | `src/services/appointments.js` | **Darryl** | Darryl, Frinci |
| `buildAppointmentMarkers(appointments)`, `buildRecordMarkers(records)` | `src/utils/calendar.js` | **Dhesy** | Darryl, Dhesy |
| `<Calendar value onChange markers />` | `src/components/Calendar.jsx` | **Dhesy** | Darryl, Dhesy |
| `createEmergency({...})` → `{ id, merged }` | `src/services/emergency.js` | **Frinci** | Frinci, Christania (AI) |
| `subscribeActiveEmergencies(cb)`, `setEmergencyStatus(appt, status, staff)` | `src/services/emergencyStaff.js` | **Christania** | Christania |
| `searchDirectory(term)`, `createStaffAccount()`, `subscribeStudents()` | `src/services/users.js` | Ketua | Frinci, Dhesy |
| `createNotification()`, `notifyStatusChange()` | `src/services/notifications.js` | Ketua | Darryl, Christania |

**Bentuk `markers` kalender:**
```js
{
  '2026-11-17': { color: 'yellow', done: 2, total: 3 }, // 'yellow' | 'green' | 'red'
}
```
Tanggal yang tidak ada di objek = warna netral. Merah menang, tapi tetap tampilkan `done/total`.

---

## 4. Pembagian file (siapa boleh mengubah apa)

Ubah **hanya** file milikmu. File baru boleh dibuat di dalam area sendiri.

| Pemilik | File |
|---|---|
| **Ketua** | `src/App.jsx`, `src/main.jsx`, `src/constants.js`, `src/utils/date.js`, `src/contexts/*`, `src/components/{Sidebar,Header,Modal,Title,Empty,Stat,NotificationBell}.jsx`, `src/services/{users,notifications}.js`, `src/pages/{Auth,Students,ManageStaff,Landing,Dashboard}.jsx`, `src/styles.css`, `firestore.rules`, `firebase.json`, `package.json`, `docs/`, `.github/` |
| **Darryl** | `src/pages/Appointments.jsx`, `src/components/{BookingModal,AppointmentCard}.jsx`, `src/services/appointments.js`, `src/styles/appointments.css` |
| **Dhesy** | `src/components/{Calendar,RecordModal}.jsx`, `src/utils/calendar.js`, `src/pages/Records.jsx`, `src/services/records.js`, `src/styles/{calendar,records}.css` |
| **Frinci** | `src/pages/Sos.jsx`, `src/components/SosButton.jsx`, `src/components/sos/*`, `src/services/emergency.js`, `src/styles/sos.css` |
| **Christania** | `src/components/{EmergencyAlert,UrgentPanel}.jsx`, `src/services/{emergencyStaff,ai}.js`, `src/pages/AIConsultation.jsx`, `src/styles/emergency.css` |
| **Naydeline** | `src/pages/{Profile,Health}.jsx`, `src/components/DailyTip.jsx`, `src/services/articles.js`, `src/styles/{profile,health}.css` |

**CSS:** jangan menambah ke `src/styles.css`. Buat file CSS sendiri di `src/styles/` lalu import di komponenmu: `import '../styles/sos.css';`. Awali nama class dengan nama fiturmu (misal `.sos-...`, `.cal-...`) supaya tidak bentrok.

**Butuh mengubah file orang lain?** Jangan langsung ubah. Tulis di issue pemiliknya atau di grup.

**Butuh library baru?** Minta ke ketua. Hanya ketua yang menjalankan `npm install <paket>`.
