export const STUDENT_DOMAIN = '@student.unklab.ac.id';
export const STAFF_DOMAIN = '@unklab.ac.id';

export const ROLES = { STUDENT: 'student', STAFF: 'staff', ADMIN: 'admin' };
export const STAFF_ROLES = [ROLES.STAFF, ROLES.ADMIN];
export const ROLE_LABELS = { student: 'Mahasiswa', staff: 'Staff', admin: 'Head Admin' };

export const FACULTY_DATA = {
  'Fakultas Ekonomi': ['Akuntansi (S1)', 'Manajemen (S1)', 'Sekretaris (D3)'],
  'Fakultas Filsafat': ['Ilmu Filsafat (S1)', 'Pendidikan Agama (S1)'],
  'Fakultas Keguruan dan Ilmu Pendidikan': [
    'Pendidikan Bahasa Inggris (S1)',
    'Pendidikan Ekonomi (S1)',
    'Pendidikan Luar Sekolah (S1)',
  ],
  'Fakultas Pertanian': ['Agroteknologi (S1)'],
  'Fakultas Keperawatan': ['Ilmu Keperawatan (S1)'],
  'Fakultas Ilmu Komputer': ['Sistem Informasi (S1)', 'Informatika (S1)', 'Teknologi Informasi (S1)'],
  'Fakultas Kedokteran': ['Kedokteran (S1)'],
};

export const SERVICES = [
  'Konsultasi Umum',
  'Konsultasi Kesehatan Mental',
  'Pemeriksaan Kesehatan',
  'Konsultasi Gizi',
];

export const RECORD_SERVICES = [
  'Konsultasi Umum',
  'Pemeriksaan Rutin',
  'Konsultasi Kesehatan Mental',
  'Konsultasi Gizi',
  'Penanganan Darurat',
];

export const OPEN_TIME = '07:00';
export const CLOSE_TIME = '17:00';
export const SLOT_MINUTES = 30;
export const DEFAULT_SLOT_CAPACITY = 1;

function buildSlots() {
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const slots = [];
  for (let m = toMin(OPEN_TIME); m < toMin(CLOSE_TIME); m += SLOT_MINUTES) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return slots;
}
export const TIME_SLOTS = buildSlots();

export const STATUS = {
  MENUNGGU: 'Menunggu',
  TERJADWAL: 'Terjadwal',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
  URGENT: 'Urgent',
  DITANGANI: 'Ditangani',
  DIRUJUK: 'Dirujuk',
};
export const ALL_STATUSES = Object.values(STATUS);
export const UNFINISHED_STATUSES = [STATUS.MENUNGGU, STATUS.TERJADWAL, STATUS.URGENT, STATUS.DITANGANI];
export const CANCELLABLE_STATUSES = [STATUS.MENUNGGU, STATUS.TERJADWAL];
export const ACTIVE_EMERGENCY_STATUSES = [STATUS.URGENT, STATUS.DITANGANI];

export const MERGE_WINDOW = { beforeMinutes: 30, afterMinutes: 60 };

export const HOSPITALS = [
  { name: 'RS Herman Lembean', main: false },
  { name: 'RS GMIM Tonsea', main: false },
  { name: 'RS Walanda Maramis', main: false },
  { name: 'RS Sentra Medika Minahasa Utara', main: false },
  { name: 'RS Advent Manado', main: true },
];

export const mapsSearchUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const mapsPointUrl = ({ lat, lng }) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
