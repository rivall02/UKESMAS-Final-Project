import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { subscribeStudents, setUserDisabled } from '../services/users';
import Title from '../components/Title';
import Empty from '../components/Empty';
import Avatar from '../components/Avatar';

export default function Students({ search }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);

  useEffect(
    () => subscribeStudents(setStudents, (err) => console.error('Gagal memuat mahasiswa:', err)),
    [],
  );

  async function toggleDisabled(student) {
    const action = student.disabled ? 'mengaktifkan kembali' : 'menonaktifkan';
    if (!confirm(`Yakin ingin ${action} akun ${student.name}?`)) return;
    try {
      await setUserDisabled(student.id, !student.disabled);
    } catch (err) {
      alert('Gagal memperbarui akun: ' + err.message);
    }
  }

  const q = search.toLowerCase();
  const filtered = students.filter((x) => `${x.name} ${x.nim} ${x.email}`.toLowerCase().includes(q));

  return (
    <>
      <Title
        title="Data Mahasiswa"
        desc={isAdmin ? 'Kelola akun mahasiswa yang terdaftar di UKESMAS.' : 'Daftar mahasiswa yang terdaftar di UKESMAS.'}
      />
      <div className="panel">
        <h3>Mahasiswa terdaftar ({students.length})</h3>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIM</th>
                <th>Email</th>
                <th>Fakultas / Prodi</th>
                <th>Status</th>
                {isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar user={x} size={32} />
                      <span>{x.name}</span>
                    </div>
                  </td>
                  <td>{x.nim}</td>
                  <td>{x.email}</td>
                  <td>
                    {x.faculty}
                    <small>{x.program}</small>
                  </td>
                  <td>
                    <span className={'status ' + (x.disabled ? 'ditolak' : '')}>
                      {x.disabled ? 'Nonaktif' : 'Aktif'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <button className={x.disabled ? 'textbutton' : 'delete'} onClick={() => toggleDisabled(x)}>
                        {x.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <Empty>Tidak ada mahasiswa yang cocok.</Empty>}
        </div>
      </div>
    </>
  );
}
