import React, { useState, useEffect } from 'react';
import { getArticles } from '../services/firestore';
import Title from '../components/Title';
import Modal from '../components/Modal';

export default function Health() {
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getArticles().then(setArticles);
  }, []);

  return (
    <>
      <Title
        title="Ruang Kesehatan 🌷"
        desc="Informasi ringan untuk membantu kamu merawat diri selama kuliah."
      />
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

      {selected && (
        <Modal title={selected.title} close={() => setSelected(null)}>
          <p className="articlebody">{selected.body || selected.description}</p>
          <p className="notice">
            Informasi ini bersifat edukasi umum, bukan pengganti konsultasi tenaga kesehatan.
          </p>
        </Modal>
      )}
    </>
  );
}
