import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles, Loader } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import {
  subscribeArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../services/articles';
import { todayWITA } from '../utils/date';
import Title from '../components/Title';
import Modal from '../components/Modal';
import Empty from '../components/Empty';
import '../styles/health.css';

const DEFAULT_CATEGORIES = ['Semua', 'Umum', 'Gizi', 'Kesehatan Mental', 'Pola Hidup'];

function initialArticleForm(article = null) {
  return {
    title: article?.title || '',
    category: article?.category || 'Umum',
    emoji: article?.emoji || '🌷',
    description: article?.description || '',
    body: article?.body || '',
    isTip: Boolean(article?.isTip),
    tipDate: article?.tipDate || todayWITA(),
  };
}

export default function Health() {
  const { profile, isStaff } = useAuth();
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('Semua');
  const [selected, setSelected] = useState(null);
  const [failed, setFailed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState(initialArticleForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeArticles(
      (list) => {
        setArticles(list);
        setFailed(false);
      },
      (err) => {
        console.error('Gagal berlangganan artikel:', err);
        setFailed(true);
      },
    );
    return () => unsub();
  }, []);

  const setFormField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  function handleOpenCreate() {
    setEditingArticle(null);
    setForm(initialArticleForm(null));
    setModalOpen(true);
  }

  function handleOpenEdit(article, e) {
    e.stopPropagation();
    setEditingArticle(article);
    setForm(initialArticleForm(article));
    setModalOpen(true);
  }

  async function handleDelete(article, e) {
    e.stopPropagation();
    const ok = window.confirm(`Apakah kamu yakin ingin menghapus artikel "${article.title}"?`);
    if (!ok) return;
    try {
      await deleteArticle(article.id);
    } catch (err) {
      console.error('Gagal menghapus artikel:', err);
      alert('Gagal menghapus artikel: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.isTip && !form.tipDate) {
      alert('Tanggal tips harian wajib diisi jika dijadikan tips harian.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, {
          title: form.title,
          category: form.category,
          emoji: form.emoji,
          description: form.description,
          body: form.body,
          isTip: form.isTip,
          tipDate: form.isTip ? form.tipDate : null,
        });
      } else {
        await createArticle({
          title: form.title,
          category: form.category,
          emoji: form.emoji,
          description: form.description,
          body: form.body,
          isTip: form.isTip,
          tipDate: form.isTip ? form.tipDate : null,
          createdBy: {
            id: profile?.id || '',
            name: profile?.name || 'Staff UKESMAS',
          },
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan artikel:', err);
      alert('Gagal menyimpan artikel: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const categoryList = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...articles.map((a) => a.category).filter(Boolean)]),
  );

  const filteredArticles =
    category === 'Semua' ? articles : articles.filter((a) => a.category === category);

  return (
    <>
      <Title
        title="Ruang Kesehatan 🌷"
        desc="Informasi ringan untuk membantu kamu merawat diri selama kuliah."
      />

      <div className="hl-top-bar">
        <div className="hl-categories">
          {categoryList.map((c) => (
            <button
              key={c}
              type="button"
              className={`hl-category-chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {isStaff && (
          <button type="button" className="primary" onClick={handleOpenCreate}>
            <Plus size={14} /> Tambah artikel
          </button>
        )}
      </div>

      <div className="articles">
        {filteredArticles.map((a) => (
          <article className="article" key={a.id}>
            <div>{a.emoji || '🌷'}</div>
            <div className="hl-card-meta">
              <small>{a.category}</small>
              {a.isTip && (
                <span className="hl-badge-tip">
                  <Sparkles size={10} /> Tips harian
                </span>
              )}
            </div>
            <h3>{a.title}</h3>
            <p>{a.description}</p>

            <div className="hl-card-footer">
              <button type="button" className="hl-btn-read" onClick={() => setSelected(a)}>
                Baca selengkapnya →
              </button>

              {isStaff && (
                <div className="hl-staff-actions">
                  <button
                    type="button"
                    className="hl-btn-action"
                    onClick={(e) => handleOpenEdit(a, e)}
                    title="Edit artikel"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    className="hl-btn-action delete"
                    onClick={(e) => handleDelete(a, e)}
                    title="Hapus artikel"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {!filteredArticles.length && (
        <Empty>
          {failed
            ? 'Gagal memuat artikel. Coba muat ulang halaman.'
            : 'Belum ada artikel kesehatan.'}
        </Empty>
      )}

      {selected && (
        <Modal title={selected.title} close={() => setSelected(null)}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{selected.emoji || '🌷'}</div>
          <p className="articlebody" style={{ whiteSpace: 'pre-wrap' }}>
            {selected.body || selected.description}
          </p>
          <p className="notice" style={{ marginTop: 15 }}>
            Informasi ini bersifat edukasi umum, bukan pengganti konsultasi tenaga kesehatan.
          </p>
        </Modal>
      )}

      {modalOpen && (
        <Modal
          title={editingArticle ? 'Edit Artikel' : 'Tambah Artikel'}
          close={() => !submitting && setModalOpen(false)}
        >
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Emoji ikon
              <input
                required
                value={form.emoji}
                onChange={(e) => setFormField('emoji', e.target.value)}
                placeholder="Misal: 🌷, 🍎, 💧"
              />
            </label>

            <label>
              Judul artikel
              <input
                required
                value={form.title}
                onChange={(e) => setFormField('title', e.target.value)}
                placeholder="Judul artikel kesehatan..."
              />
            </label>

            <label>
              Kategori
              <input
                required
                value={form.category}
                onChange={(e) => setFormField('category', e.target.value)}
                placeholder="Umum, Gizi, Mental, Fisik, dll."
              />
            </label>

            <label>
              Deskripsi singkat
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => setFormField('description', e.target.value)}
                placeholder="Ringkasan singkat untuk tampilan kartu..."
              />
            </label>

            <label>
              Isi lengkap
              <textarea
                required
                rows={5}
                value={form.body}
                onChange={(e) => setFormField('body', e.target.value)}
                placeholder="Penjelasan lengkap artikel..."
              />
            </label>

            <label className="hl-tip-checkbox-label">
              <input
                type="checkbox"
                checked={form.isTip}
                onChange={(e) => setFormField('isTip', e.target.checked)}
              />
              <span>Jadikan tips harian</span>
            </label>

            {form.isTip && (
              <label>
                Tanggal tips harian (WITA)
                <input
                  type="date"
                  required
                  value={form.tipDate}
                  onChange={(e) => setFormField('tipDate', e.target.value)}
                />
              </label>
            )}

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader size={14} className="spin" /> Menyimpan...
                </>
              ) : editingArticle ? (
                'Simpan perubahan'
              ) : (
                'Tambah artikel'
              )}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
