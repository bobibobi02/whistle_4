import { useState } from 'react';

export default function PluginControls({ pluginKey, initialConfig }) {
  const [config, setConfig] = useState(JSON.stringify(initialConfig || {}, null, 2));

  const save = async () => {
    await fetch('/api/mod/plugins/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: pluginKey, config: JSON.parse(config) }),
    });
    alert('Config saved');
  };

  return (
    <div className="mt-2 p-4 bg-gray-50 rounded">
      <textarea
        value={config}
        onChange={e => setConfig(e.target.value)}
        className="w-full h-32 p-2 border rounded font-mono"
      />
      <button onClick={save} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Save Config
      </button>
    </div>
);
}
