import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Editor({ value, onChange }) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex mb-2">
        <button onClick={() => setPreview(false)} className="px-2">Edit</button>
        <button onClick={() => setPreview(true)} className="px-2">Preview</button>
      </div>
      {preview ? (
        <div className="border p-2 rounded">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="border p-2 w-full rounded h-40"
        />
      )}
    </div>
);
}
