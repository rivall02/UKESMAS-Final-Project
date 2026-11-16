import React, { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRecords, getUsers, createRecord } from '../services/firestore';
import Title from '../components/Title';
import Empty from '../components/Empty';

const dateFmt = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '-';

export default function Records() {
  const { profile, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: '', date: '', service: 'Konsultasi Umum', summary: '' });

  async function load() {
    try {
      const data = await getRecords(profile.id, isAdmin);
      setRecords(data);
      if (isAdmin) {
        const u = await getUsers();
        setUsers(u.filter((x) => x.role === 'student'));
      }
    } catch (err) {
      console.error('Gagal memuat rekam medis:', err);
    }
  }

  useEffect(() => {
    if (profile) load();
  }, [profile, isAdmin]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await createRecord({ ...form, provider: 'Petugas UKESMAS' });
      await load();
      setForm({ userId: '', date: '', service: 'Konsultasi Umum', summary: '' });
    } catch (err) {
      console.error('Gagal menambah rekam medis:', err);
      alert('Gagal menyimpan catatan: ' + err.message);
    }
  }

  return (
    <>
      <Title title="Rekam Medis" desc="Riwayat pemeriksaan dan catatan layanan kesehatan." />

      {isAdmin && (
        <div className="panel">
          <h3>Tambah catatan pemeriksaan</h3>
          <form className="recordform" onSubmit={handleAdd}>
            <label>
              Mahasiswa
              <select
                required
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
              >
                <option value="">Pilih mahasiswa</option>
                {users.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} ({x.nim})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tanggal
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label>
              Layanan
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                <option>Konsultasi Umum</option>
                <option>Pemeriksaan Rutin</option>
                <option>Konsultasi Kesehatan Mental</option>
              </select>
            </label>
            <label className="wide">
              Ringkasan
              <textarea
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </label>
            <button className="primary">Simpan catatan</button>
          </form>
        </div>
      )}

      <div className="panel">
        <h3>Riwayat pemeriksaan</h3>
        {records.map((r) => (
          <div className="record" key={r.id}>
            <ClipboardList />
            <div>
              <b>{r.service}</b>
              <small>{dateFmt(r.date)} · {r.provider || 'Petugas UKESMAS'}</small>
              <p>{r.summary}</p>
            </div>
          </div>
        ))}
        {!records.length && <Empty>Belum ada riwayat pemeriksaan.</Empty>}
      </div>
    </>
  );
}
