import React from 'react';

export default function EndpointCard({endpoint, method, description, code}: any) {
  return (
    <div className="border p-4 rounded mb-4">
      <div className="font-bold">{method.toUpperCase()} {endpoint}</div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
