import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Title from '../components/Title';
import { THEMES, getTheme, setTheme, subscribeTheme } from '../theme';
import '../styles/settings.css';

export default function Settings() {
  const [theme, setThemeState] = useState(getTheme);

  useEffect(() => subscribeTheme(setThemeState), []);

  const active = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <>
      <Title title="Pengaturan" desc="Sesuaikan tampilan UKESMAS sesuai seleramu." />

      <div className="panel set-panel">
        <h3>Tema</h3>
        <p className="set-desc">
          Pilih warna utama aplikasi. Pilihanmu tersimpan di perangkat ini dan tetap dipakai saat kamu
          kembali.
        </p>

        <div className="set-swatches" role="radiogroup" aria-label="Tema warna" data-theme-ignore>
          {THEMES.map((t) => {
            const selected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={t.label}
                title={t.label}
                className={`set-swatch ${selected ? 'selected' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <span className="set-swatch-dot" style={{ background: t.swatch }}>
                  {selected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                </span>
                <small>{t.label}</small>
              </button>
            );
          })}
        </div>

        <p className="set-current">
          Tema aktif: <b>{active.label}</b>
        </p>
      </div>
    </>
  );
}
