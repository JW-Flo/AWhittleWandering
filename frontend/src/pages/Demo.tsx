import React, { useState } from 'react';

const Demo: React.FC = () => {
  const [log, setLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoiner = async () => {
    setLoading(true);
    setError(null);
    setLog(null);
    try {
      const res = await fetch('/api/joiner', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLog(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h1>AtlasIT Joiner Demo</h1>
      <p>This demo simulates a joiner flow via the backend Worker.</p>
      <button onClick={handleJoiner} disabled={loading} style={{ padding: '8px 16px', fontSize: 16 }}>
        {loading ? 'Running...' : 'Simulate Joiner'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 16 }}>Error: {error}</div>}
      {log && (
        <pre style={{ marginTop: 24, background: '#f8f8f8', padding: 16, borderRadius: 4, fontSize: 14 }}>
          {log}
        </pre>
      )}
    </div>
  );
};

export default Demo;
