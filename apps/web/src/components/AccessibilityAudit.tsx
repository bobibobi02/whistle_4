import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import axe from '@axe-core/react';

export default function AccessibilityAudit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      axe(React, ReactDOM, 1000);
    }
  }, []);

  return null;
}
