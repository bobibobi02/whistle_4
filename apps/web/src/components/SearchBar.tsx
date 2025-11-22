import { useState } from 'react';
import Router from 'next/router';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    Router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex">
      <input
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border p-2 rounded-l flex-grow"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white px-4 rounded-r"
      >
        Search
      </button>
    </div>
  );
}
