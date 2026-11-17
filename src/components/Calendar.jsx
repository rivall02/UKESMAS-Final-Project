export default function Calendar({ value, onChange }) {
  return (
    <div className="calendar-stub">
      <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="link" onClick={() => onChange('')}>
          Semua tanggal
        </button>
      )}
    </div>
  );
}
