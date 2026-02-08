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
    <div className="max-w-xl mx-auto mt-8 p-6 border border-border rounded-lg">
      <h1>A Whittle Wandering — API Demo</h1>
      <p>This demo simulates a backend API call via the edge Worker.</p>
      <button onClick={handleJoiner} disabled={loading} className="px-4 py-2 text-base">
        {loading ? 'Running...' : 'Simulate Joiner'}
      </button>
      {error && <div className="text-destructive mt-4">Error: {error}</div>}
      {log && (
        <pre className="mt-6 bg-muted p-4 rounded text-sm">
          {log}
        </pre>
      )}
    </div>
  );
};

export default Demo;
