import { useState } from 'react';

export default function RoleControls({ subforumName, userId, currentRole, isNew }) {
  const [targetUserId, setTargetUserId] = useState(userId);
  const [role, setRole] = useState(currentRole || 'MODERATOR');

  const assignRole = async () => {
    if (!targetUserId) return alert('User ID required');
    const res = await fetch('/api/mod/assignRole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subforumName, userId: targetUserId, role })
    });
    if (res.ok) window.location.reload();
  };

  const removeRole = async () => {
    const res = await fetch('/api/mod/removeRole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subforumName, userId: targetUserId })
    });
    if (res.ok) window.location.reload();
  };

  return (
    <div className="flex space-x-2">
      {isNew ? (
        <>
          <input
            type="text"
            placeholder="User ID"
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)}
            className="border p-1 rounded"
          />
          <select value={role} onChange={e => setRole(e.target.value)} className="border p-1 rounded">
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button onClick={assignRole} className="px-3 py-1 bg-blue-500 text-white rounded">Assign</button>
        </>
      ) : (
        <button onClick={removeRole} className="px-3 py-1 bg-red-500 text-white rounded">Remove</button>
      )}
    </div>
);
}
