import { useEffect, useMemo, useState } from 'react';
import { Helmet } from '@/lib/helmet';
import { supabase } from '@/integrations/supabase/client';
import { LuxuryHeader } from '@/components/ui/luxury-header';
import { SiteFooter } from '@/components/ui/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

type EventRow = {
  id: string;
  event_type: string;
  source: string | null;
  created_at: string;
  motor_model: string | null;
  motor_hp: number | null;
  quote_value: number | null;
  page_path: string | null;
};

const FUNNEL_STEPS = [
  'agent_opened',
  'motor_viewed',
  'quote_generated',
  'quote_saved',
  'lead_submitted',
  'deposit_started',
] as const;

const RANGES = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
} as const;
type RangeKey = keyof typeof RANGES;

function classifySource(source: string | null): 'AI' | 'Search' | 'Direct' | 'Other' {
  const s = (source || '').toLowerCase();
  if (['chatgpt', 'perplexity', 'claude', 'ai'].some((k) => s.includes(k))) return 'AI';
  if (['google', 'bing', 'referral'].some((k) => s.includes(k))) return 'Search';
  if (s === 'direct' || s === '') return 'Direct';
  return 'Other';
}

export default function AgentFunnel() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const since = new Date(Date.now() - RANGES[range] * 24 * 60 * 60 * 1000).toISOString();
    (async () => {
      const { data, error } = await supabase
        .from('agent_events')
        .select('id, event_type, source, created_at, motor_model, motor_hp, quote_value, page_path')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5000);
      if (!cancelled) {
        if (error) {
          console.error('Failed to load agent_events', error);
          setEvents([]);
        } else {
          setEvents((data || []) as EventRow[]);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const funnel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) counts[ev.event_type] = (counts[ev.event_type] || 0) + 1;
    return FUNNEL_STEPS.map((step) => ({ step, count: counts[step] || 0 }));
  }, [events]);

  const topMotors = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      if (ev.event_type !== 'motor_viewed' || !ev.motor_model) continue;
      map.set(ev.motor_model, (map.get(ev.motor_model) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [events]);

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, number> = { AI: 0, Search: 0, Direct: 0, Other: 0 };
    for (const ev of events) map[classifySource(ev.source)] += 1;
    return map;
  }, [events]);

  const aiOnlyFunnel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      if (classifySource(ev.source) !== 'AI') continue;
      counts[ev.event_type] = (counts[ev.event_type] || 0) + 1;
    }
    return FUNNEL_STEPS.map((step) => ({ step, count: counts[step] || 0 }));
  }, [events]);

  const total = events.length;
  const top = funnel[0]?.count || 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Agent Funnel | Admin</title>
      </Helmet>
      <LuxuryHeader />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Agent Funnel</h1>
            <p className="text-sm text-muted-foreground">
              How visitors (including AI agents) move from arrival to deposit.
            </p>
          </div>
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="7d">Last 7 days</TabsTrigger>
              <TabsTrigger value="30d">Last 30 days</TabsTrigger>
              <TabsTrigger value="90d">Last 90 days</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading events…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelBars data={funnel} top={top} />
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">AI-referred only</h3>
                  <FunnelBars data={aiOnlyFunnel} top={aiOnlyFunnel[0]?.count || 0} accent />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(sourceBreakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{v}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                  Total events: {total}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Most-Viewed Motors</CardTitle>
              </CardHeader>
              <CardContent>
                {topMotors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No motor_viewed events yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {topMotors.map(([model, count]) => (
                      <li key={model} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-foreground">{model}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 max-h-96 overflow-auto text-xs">
                  {events.slice(0, 50).map((ev) => (
                    <li key={ev.id} className="flex items-start justify-between gap-2 border-b border-border pb-1">
                      <div>
                        <div className="font-medium text-foreground">{ev.event_type}</div>
                        <div className="text-muted-foreground">
                          {ev.motor_model || ev.page_path || '—'}
                        </div>
                      </div>
                      <div className="text-right text-muted-foreground">
                        <div>{classifySource(ev.source)}</div>
                        <div>{new Date(ev.created_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FunnelBars({
  data,
  top,
  accent,
}: {
  data: { step: string; count: number }[];
  top: number;
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      {data.map(({ step, count }, i) => {
        const widthPct = top > 0 ? Math.max(2, (count / top) * 100) : 2;
        const prev = i === 0 ? null : data[i - 1].count;
        const conv = prev && prev > 0 ? ((count / prev) * 100).toFixed(1) + '%' : '—';
        return (
          <div key={step}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-foreground">{step}</span>
              <span className="text-muted-foreground">
                {count} {i > 0 && <span className="ml-2">({conv})</span>}
              </span>
            </div>
            <div className="h-3 rounded bg-muted overflow-hidden">
              <div
                className={accent ? 'h-full bg-accent' : 'h-full bg-primary'}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
