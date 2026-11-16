import React from 'react';

export default function Stat({ n, label, icon }) {
  return (
    <div className="stat">
      <span>{icon}</span>
      <strong>{n}</strong>
      <b>{label}</b>
      <small>Data prototype</small>
    </div>
  );
}
