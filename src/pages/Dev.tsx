// src/pages/Dev.tsx
import { useEffect, useState } from 'react';
import { listQuotes, seedQuote } from '../lib/quotesApi';

export default function Dev() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true); setMsg(null);
    try {
      const { quotes } = await listQuotes(20);
      setQuotes(quotes);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  }

  async function createSeed() {
    setLoading(true); setMsg(null);
    try {
      await seedQuote();
      setMsg('Seeded a quote ✔');
      await refresh();
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>HBW Quotes – Dev</h1>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={refresh} disabled={loading}>Refresh</button>
        <button onClick={createSeed} disabled={loading}>Create Seed Quote</button>
      </div>
      {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}
      {loading && <div>Loading… grab a Timbit ☕️</div>}
      <pre style={{ background:'#111', color:'#0f0', padding:12, borderRadius:8 }}>
        {JSON.stringify(quotes, null, 2)}
      </pre>
    </div>
  );
}
