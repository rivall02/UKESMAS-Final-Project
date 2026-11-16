import React from 'react';

export default function Title({ title, desc }) {
  return (
    <div className="title">
      <small className="eyebrow">UKESMAS STUDENT WELLNESS</small>
      <h1>{title} <em>♡</em></h1>
      <p>{desc}</p>
    </div>
  );
}
