import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { getDailyTip } from '../services/articles';
import '../styles/health.css';

export default function DailyTip() {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    getDailyTip()
      .then((data) => {
        if (alive) {
          setTip(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat tips harian:', err);
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !tip) return null;

  return (
    <div className="hl-tip-card">
      <div className="hl-tip-card-left">
        <div className="hl-tip-card-emoji">{tip.emoji || '🌷'}</div>
        <div className="hl-tip-card-content">
          <span className="hl-tip-card-badge">
            <Sparkles size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Tips Hari Ini
          </span>
          <h4>{tip.title}</h4>
          <p>{tip.description}</p>
        </div>
      </div>
      <button
        type="button"
        className="hl-tip-card-btn"
        onClick={() => navigate('/health')}
        title="Lihat selengkapnya di Ruang Kesehatan"
      >
        Selengkapnya <ArrowUpRight size={13} />
      </button>
    </div>
  );
}
