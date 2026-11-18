import { useState, useEffect } from 'react';
import { Search, MapPin, Ambulance, AlertCircle, ExternalLink, X } from 'lucide-react';
import { HOSPITALS, mapsSearchUrl } from '../../constants';
import { searchDirectory } from '../../services/users';

export default function OtherPersonForm({ onSubmit, loading }) {
  const [subType, setSubType] = useState('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [description, setDescription] = useState('');
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (subType !== 'student' || selectedStudent || trimmed.length < 2) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchDirectory(trimmed);
        if (active) {
          setSearchResults(results);
        }
      } catch (err) {
        console.error('Gagal mencari mahasiswa:', err);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, subType, selectedStudent]);

  const displayedResults =
    subType !== 'student' || selectedStudent || searchTerm.trim().length < 2
      ? []
      : searchResults;

  function handleSelectStudent(s) {
    setSelectedStudent(s);
    setSearchTerm('');
    setSearchResults([]);
  }

  function handleClearStudent() {
    setSelectedStudent(null);
    setSearchTerm('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (subType === 'student' && !selectedStudent) {
      setError('Silakan pilih mahasiswa terdaftar terlebih dahulu.');
      return;
    }

    if (!locationDetail.trim()) {
      setError('Lokasi pasti wajib diisi.');
      return;
    }

    if (!description.trim()) {
      setError('Penjelasan singkat kondisi darurat wajib diisi.');
      return;
    }

    const victim =
      subType === 'student'
        ? { id: selectedStudent.id, name: selectedStudent.name, nim: selectedStudent.nim }
        : { id: null, name: externalName.trim() || 'Bukan mahasiswa', nim: '' };

    onSubmit({
      victimType: subType,
      victim,
      locationDetail: locationDetail.trim(),
      description: description.trim(),
      ambulanceRequested,
    });
  }

  return (
    <form className="sos-form-card" onSubmit={handleSubmit}>
      <div className="sos-sub-tabs">
        <button
          type="button"
          className={`sos-sub-tab ${subType === 'student' ? 'active' : ''}`}
          onClick={() => {
            setSubType('student');
            setError('');
          }}
        >
          Mahasiswa terdaftar
        </button>
        <button
          type="button"
          className={`sos-sub-tab ${subType === 'external' ? 'active' : ''}`}
          onClick={() => {
            setSubType('external');
            setError('');
          }}
        >
          Bukan mahasiswa (dosen/tamu)
        </button>
      </div>

      {subType === 'student' ? (
        <div className="form">
          {/* Sengaja bukan <label>: klik di dalam label ikut menekan tombol "Ganti" sehingga pilihan langsung terhapus. */}
          <div className="sos-field" role="group" aria-labelledby="sos-search-label">
            <span id="sos-search-label">Cari Mahasiswa (Nama atau NIM)</span>
            {selectedStudent ? (
              <div className="sos-selected-student">
                <div>
                  <b>{selectedStudent.name}</b>
                  <small>{selectedStudent.nim}</small>
                </div>
                <button type="button" className="sos-clear-btn" onClick={handleClearStudent}>
                  <X size={14} /> Ganti
                </button>
              </div>
            ) : (
              <div className="sos-search-wrap">
                <div className="search" style={{ display: 'flex', width: '100%' }}>
                  <Search size={14} color="#ad98a4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-labelledby="sos-search-label"
                    placeholder="Ketik minimal 2 huruf..."
                    style={{ width: '100%' }}
                  />
                </div>
                {isSearching && <small style={{ color: '#ad98a4', marginTop: 4 }}>Mencari...</small>}
                {displayedResults.length > 0 && (
                  <div className="sos-search-results">
                    {displayedResults.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className="sos-search-item"
                        onClick={() => handleSelectStudent(s)}
                      >
                        <b>{s.name}</b>
                        <small>{s.nim}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="form">
          <label>
            Nama Korban (Opsional)
            <input
              type="text"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              placeholder="Misal: Dosen Budi / Tamu Kampus"
            />
          </label>
        </div>
      )}

      <div className="form">
        <label>
          Lokasi Pasti *
          <input
            type="text"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder="Contoh: Asrama Putra Lt. 2 Kamar 204 atau Depan GK2"
            required
          />
        </label>
      </div>

      <div className="form">
        <label>
          Penjelasan Singkat Kondisi Darurat *
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Pingsan saat olahraga, sesak napas berat..."
            required
          />
        </label>
      </div>

      <label className="sos-checkbox-row">
        <input
          type="checkbox"
          checked={ambulanceRequested}
          onChange={(e) => setAmbulanceRequested(e.target.checked)}
        />
        <Ambulance size={18} color="#ff4d4f" />
        <span className="sos-checkbox-text">Minta ambulans kampus</span>
      </label>

      <div className="sos-hospitals-section">
        <h4>Rumah Sakit Rujukan Sekitar Kampus:</h4>
        <div className="sos-hospital-list">
          {HOSPITALS.map((h) => (
            <div key={h.name} className={`sos-hospital-item ${h.main ? 'main-rs' : ''}`}>
              <div className="sos-hospital-info">
                <span className="sos-hospital-name">{h.name}</span>
                {h.main && <span className="sos-main-badge">Rujukan Utama</span>}
              </div>
              <a
                href={mapsSearchUrl(h.name)}
                target="_blank"
                rel="noreferrer"
                className="sos-hospital-link"
              >
                <MapPin size={12} /> Buka Maps <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="sos-error-box">
          <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {error}
        </div>
      )}

      <button type="submit" className="sos-submit-btn" disabled={loading}>
        {loading ? 'Mengirim Laporan...' : 'Kirim SOS Darurat'}
      </button>
    </form>
  );
}
