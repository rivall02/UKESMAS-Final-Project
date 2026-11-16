import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, deleteUser } from '../services/firestore';
import Title from '../components/Title';

export default function Students({ search }) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);

  async function load() {
    const data = await getUsers();
    setUsers(data.filter((u) => u.role === 'student'));
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function handleDelete(id) {
    if (!confirm('Hapus akun mahasiswa ini?')) return;
    await deleteUser(id);
    await load();
  }

  const filtered = users.filter((x) =>
    `${x.name} ${x.nim} ${x.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Title title="Data Mahasiswa" desc="Kelola akun mahasiswa yang terdaftar di UKESMAS." />
      <div className="panel">
        <h3>Mahasiswa terdaftar ({users.length})</h3>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIM</th>
                <th>Email</th>
                <th>Fakultas / Prodi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{x.nim}</td>
                  <td>{x.email}</td>
                  <td>
                    {x.faculty}
                    <small>{x.program}</small>
                  </td>
                  <td>
                    <button className="delete" onClick={() => handleDelete(x.id)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
