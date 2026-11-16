import React from 'react';
import { Flower2 } from 'lucide-react';

export default function Empty({ children }) {
  return (
    <div className="empty">
      <Flower2 />
      {children}
    </div>
  );
}
