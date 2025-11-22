'use client';
import { useEffect, useState } from 'react';

export default function TranslationList({ locale, key }) {
  const [translations, setTranslations] = useState([]);

  useEffect(() => {
    fetch(`/api/translations?locale=${locale}&key=${key}&approved=true`)
      .then(res => res.json())
      .then(setTranslations);
  }, [locale, key]);

  if (!translations.length) return null;

  return (
    <div className="mt-4">
      <h3 className="font-semibold">Community Translations</h3>
      <ul className="list-disc list-inside">
        {translations.map(t => (
          <li key={t.id} className="mt-1">{t.text}</li>
        ))}
      </ul>
    </div>
  );
}
