import { useState, useEffect } from 'react';
import { getArticles } from '../services/articles';
import Title from '../components/Title';
import Modal from '../components/Modal';
import Empty from '../components/Empty';

export default function Health() {
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getArticles()
      .then((list) => alive && setArticles(list))
      .catch((err) => {
        console.error('Gagal memuat artikel:', err);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <Title title="Ruang Kesehatan 🌷" desc="Informasi ringan untuk membantu kamu merawat diri selama kuliah." />
      <div className="articles">
        {articles.map((a) => (
          <article className="article" key={a.id}>
            <div>{a.emoji}</div>
            <small>{a.category}</small>
            <h3>{a.title}</h3>
            <p>{a.description}</p>
            <button className="link" onClick={() => setSelected(a)}>
              Baca selengkapnya →
            </button>
          </article>
        ))}
      </div>
      {!articles.length && (
        <Empty>{failed ? 'Gagal memuat artikel. Coba muat ulang halaman.' : 'Belum ada artikel kesehatan.'}</Empty>
      )}

      {selected && (
        <Modal title={selected.title} close={() => setSelected(null)}>
          <p className="articlebody">{selected.body || selected.description}</p>
          <p className="notice">Informasi ini bersifat edukasi umum, bukan pengganti konsultasi tenaga kesehatan.</p>
        </Modal>
      )}
    </>
  );
}
