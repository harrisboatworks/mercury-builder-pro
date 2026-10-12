import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { QuoteProvider } from '@/contexts/QuoteContext';
import { Toaster } from '@/components/ui/toaster';
import AdminQuoteDetail from '@/pages/AdminQuoteDetail';
import '@/index.css';
import { DEPOSIT_SAVED_ID, SUBMITTED_ID } from './fixtures';
import { getHarnessEvents, subscribeHarnessEvents } from './harness-log';
import { blockedEvents, replayScenario, type ScenarioName, type ScenarioResult } from './replay';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function HarnessApp() {
  const [scenario, setScenario] = useState<ScenarioName>('submitted');
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'pass' | 'fail'>('idle');
  const [error, setError] = useState('');
  const [logVersion, setLogVersion] = useState(0);
  const quoteId = scenario === 'submitted' ? SUBMITTED_ID : DEPOSIT_SAVED_ID;

  useEffect(() => subscribeHarnessEvents(() => setLogVersion((value) => value + 1)), []);

  async function runBoth() {
    setStatus('running');
    setError('');
    setResults([]);
    try {
      setScenario('submitted');
      const submitted = await replayScenario('submitted');
      setResults([submitted]);
      setScenario('deposit');
      const deposit = await replayScenario('deposit');
      const next = [submitted, deposit];
      const blocked = blockedEvents();
      const pass = next.every((result) => result.pass) && blocked.length === 0;
      setResults(next);
      setStatus(pass ? 'pass' : 'fail');
      if (blocked.length > 0) setError(`Blocked transports: ${JSON.stringify(blocked)}`);
    } catch (caught) {
      setStatus('fail');
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const api = {
      show: (next: ScenarioName) => setScenario(next),
      runReplay: runBoth,
    };
    (window as unknown as { __HBW_QUOTE_HARNESS__?: typeof api }).__HBW_QUOTE_HARNESS__ = api;
    if (params.get('autorun') === '1') {
      void runBoth();
    }
  }, []);

  const events = getHarnessEvents();
  void logVersion;

  return (
    <>
      <aside
        data-harness-panel
        data-harness-status={status}
        data-harness-scenario={scenario}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background: '#0f172a',
          color: '#e2e8f0',
          padding: '12px 16px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 14,
        }}
      >
        <strong>Offline AdminQuoteDetail harness</strong>
        <span style={{ marginLeft: 12 }}>status: {status}</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={() => setScenario('submitted')}>Show submitted quote</button>
          <button type="button" onClick={() => setScenario('deposit')}>Show paid deposit</button>
          <button type="button" onClick={() => void runBoth()}>Replay both screens</button>
        </div>
        {error && <p data-harness-error style={{ color: '#fecaca' }}>{error}</p>}
        <ul data-harness-results style={{ margin: '8px 0', paddingLeft: 18 }}>
          {results.flatMap((result) => result.checks.map((item) => (
            <li key={`${result.scenario}-${item.name}`} data-pass={item.pass ? 'yes' : 'no'}>
              {result.scenario}: {item.pass ? 'pass' : 'fail'} — {item.name}{item.pass ? '' : ` (${item.actual})`}
            </li>
          )))}
        </ul>
        <pre data-harness-log style={{ maxHeight: 160, overflow: 'auto', background: '#020617', padding: 8 }}>
          {JSON.stringify(events.filter((event) => event.kind !== 'table'), null, 2)}
        </pre>
      </aside>
      <MemoryRouter key={quoteId} initialEntries={[`/admin/quotes/${quoteId}`]}>
        <Routes>
          <Route path="/admin/quotes/:id" element={<AdminQuoteDetail />} />
        </Routes>
      </MemoryRouter>
      <Toaster />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <AuthProvider>
        <QuoteProvider>
          <HarnessApp />
        </QuoteProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>,
);
