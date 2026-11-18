import { useState, useEffect, useRef } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { todayWITA, formatDate } from '../utils/date';
import '../styles/calendar.css';

const DAYS_HEADER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const DEFAULT_LEGEND = [
  { color: 'neutral', label: 'Tidak ada janji' },
  { color: 'yellow', label: 'Belum selesai' },
  { color: 'green', label: 'Selesai semua' },
  { color: 'red', label: 'Ada darurat' },
];

function parseYearMonth(dateString) {
  if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m] = dateString.split('-').map(Number);
    return { year: y, month: m - 1 };
  }
  const today = todayWITA();
  const [y, m] = today.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export default function Calendar({ value = '', onChange, markers = {}, legend = DEFAULT_LEGEND }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const [prevValue, setPrevValue] = useState(value);
  const [viewYear, setViewYear] = useState(() => parseYearMonth(value).year);
  const [viewMonth, setViewMonth] = useState(() => parseYearMonth(value).month);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const parsed = parseYearMonth(value);
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelectDate(dateStr) {
    if (value === dateStr) {
      onChange('');
    } else {
      onChange(dateStr);
    }
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange('');
  }

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i += 1) {
    cells.push({ empty: true, key: `empty-${i}` });
  }

  const todayStr = todayWITA();

  for (let d = 1; d <= daysInMonth; d += 1) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dateStr = `${viewYear}-${mStr}-${dStr}`;
    const marker = markers[dateStr];

    cells.push({
      empty: false,
      key: dateStr,
      dateStr,
      dayNum: d,
      marker,
      isToday: dateStr === todayStr,
      isSelected: dateStr === value,
    });
  }

  return (
    <div className="calx-container" ref={containerRef}>
      <div className="calx-trigger-group">
        <button
          type="button"
          className={`calx-trigger ${value ? 'calx-active' : ''}`}
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Filter tanggal"
        >
          <CalendarDays size={14} />
          <span>{value ? formatDate(value) : 'Semua tanggal'}</span>
        </button>
        {value && (
          <button
            type="button"
            className="calx-clear-btn"
            onClick={handleClear}
            aria-label="Hapus filter tanggal"
            title="Hapus filter tanggal"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="calx-popup">
          <div className="calx-header">
            <button
              type="button"
              className="calx-nav-btn"
              onClick={prevMonth}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="calx-title">{monthTitle}</div>
            <button
              type="button"
              className="calx-nav-btn"
              onClick={nextMonth}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calx-weekdays">
            {DAYS_HEADER.map((name) => (
              <div key={name} className="calx-weekday">
                {name}
              </div>
            ))}
          </div>

          <div className="calx-grid">
            {cells.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} className="calx-cell calx-empty" aria-hidden="true" />;
              }

              const markerClass = cell.marker ? `calx-marker-${cell.marker.color}` : '';
              const todayClass = cell.isToday ? 'calx-today' : '';
              const selectedClass = cell.isSelected ? 'calx-selected' : '';

              return (
                <button
                  type="button"
                  key={cell.key}
                  className={`calx-cell ${markerClass} ${todayClass} ${selectedClass}`.trim()}
                  onClick={() => handleSelectDate(cell.dateStr)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectDate(cell.dateStr);
                    }
                  }}
                  aria-label={`Tanggal ${cell.dayNum}`}
                >
                  <span className="calx-cell-num">{cell.dayNum}</span>
                  {cell.marker && (
                    <span className="calx-badge">
                      {cell.marker.done}/{cell.marker.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="calx-footer">
            <button
              type="button"
              className="calx-all-btn"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Semua tanggal
            </button>

            <div className="calx-legend">
              {legend.map((item) => (
                <div className="calx-legend-item" key={item.label}>
                  <span className={`calx-dot calx-dot-${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
