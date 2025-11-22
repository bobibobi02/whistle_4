import { useState } from 'react';

type SearchParams = {
  q: string;
  subforum: string;
  author: string;
  dateFrom: string;
  dateTo: string;
};

export default function SearchFilters({
  onSearch,
}: {
  onSearch: (params: SearchParams) => void;
}) {
  const [query, setQuery] = useState('');
  const [subforum, setSubforum] = useState('');
  const [author, setAuthor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleSearch = () => {
    onSearch({ q: query, subforum, author, dateFrom, dateTo });
  };

  return (
    <div className="space-y-2 p-4 bg-gray-50 rounded">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Subforum"
          value={subforum}
          onChange={(e) => setSubforum(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Author Email"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <button
        onClick={handleSearch}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Search
      </button>
    </div>
  );
}
