import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, FileText, Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface FileCheck {
  url: string;
  ok: boolean;
  status: number;
  contentType?: string;
  sizeBytes?: number;
  urlCount?: number;
  issues: string[];
  excerpt?: string;
}

interface LighthouseScores {
  ok: boolean;
  url: string;
  strategy: 'mobile' | 'desktop';
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  lcp?: string;
  cls?: string;
  fcp?: string;
  tbt?: string;
  error?: string;
  fetchedAt: string;
}

interface HealthResult {
  ok: boolean;
  startedAt: string;
  completedAt: string;
  site: string;
  files: { robots: FileCheck; sitemap: FileCheck; llms: FileCheck };
  lighthouse: { mobile: LighthouseScores; desktop: LighthouseScores };
}

function scoreColor(score?: number): string {
  if (score == null) return 'bg-muted text-muted-foreground';
  if (score >= 90) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function FileCheckCard({ title, check }: { title: string; check: FileCheck }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {check.ok ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          {title}
          <Badge variant="outline" className="ml-auto">
            HTTP {check.status}
          </Badge>
        </CardTitle>
        <CardDescription className="break-all">{check.url}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {check.contentType && <span>type: {check.contentType}</span>}
          {check.sizeBytes != null && <span>size: {check.sizeBytes.toLocaleString()} bytes</span>}
          {check.urlCount != null && <span>urls: {check.urlCount}</span>}
        </div>
        {check.issues.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{check.issues.length} issue(s)</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1">
                {check.issues.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-green-700 text-sm">No issues detected.</p>
        )}
        {check.excerpt && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Preview</summary>
            <pre className="mt-1 p-2 bg-muted rounded overflow-x-auto whitespace-pre-wrap">
              {check.excerpt}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ label, score }: { label: string; score?: number }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${scoreColor(score)}`}>
      <div className="text-xs uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold">{score ?? '—'}</div>
    </div>
  );
}

function LighthouseCard({ scores }: { scores: LighthouseScores }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base capitalize">
          <Gauge className="h-5 w-5" />
          Lighthouse — {scores.strategy}
        </CardTitle>
        <CardDescription>Powered by Google PageSpeed Insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {scores.error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lighthouse failed</AlertTitle>
            <AlertDescription className="text-xs break-all">{scores.error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <ScoreCard label="Perf" score={scores.performance} />
              <ScoreCard label="A11y" score={scores.accessibility} />
              <ScoreCard label="Best Practices" score={scores.bestPractices} />
              <ScoreCard label="SEO" score={scores.seo} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div><span className="text-muted-foreground">LCP:</span> {scores.lcp ?? '—'}</div>
              <div><span className="text-muted-foreground">CLS:</span> {scores.cls ?? '—'}</div>
              <div><span className="text-muted-foreground">FCP:</span> {scores.fcp ?? '—'}</div>
              <div><span className="text-muted-foreground">TBT:</span> {scores.tbt ?? '—'}</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSEOHealth() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('seo-health-check', {
        body: {},
      });
      if (error) throw error;
      setResult(data as HealthResult);
      toast.success('SEO health check complete');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      toast.error(`Check failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7" />
            SEO Health Check
          </h1>
          <p className="text-muted-foreground mt-1">
            Validates robots.txt, sitemap.xml, and llms.txt against the production
            host (www.mercuryrepower.ca), then runs Google Lighthouse via the
            PageSpeed Insights API for mobile + desktop.
          </p>
        </div>
        <Button onClick={runCheck} disabled={loading} size="lg">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Health Check
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Health check failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!result && !loading && !error && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Click <strong>Run Health Check</strong> to fetch live results.
            Lighthouse can take 20–40 seconds to complete.
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Alert variant={result.ok ? 'default' : 'destructive'}>
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>{result.ok ? 'All checks passed' : 'Issues detected'}</AlertTitle>
            <AlertDescription className="text-xs">
              Ran against {result.site} at {new Date(result.completedAt).toLocaleString()}
            </AlertDescription>
          </Alert>

          <div>
            <h2 className="text-xl font-semibold mb-3">File validation</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <FileCheckCard title="robots.txt" check={result.files.robots} />
              <FileCheckCard title="sitemap.xml" check={result.files.sitemap} />
              <FileCheckCard title="llms.txt" check={result.files.llms} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Lighthouse scores</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LighthouseCard scores={result.lighthouse.mobile} />
              <LighthouseCard scores={result.lighthouse.desktop} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
