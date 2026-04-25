import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { caseStudies } from '@/data/caseStudies';
import { locations } from '@/data/locations';

const SITE = 'https://www.mercuryrepower.ca';

// Core URLs that should always be re-pinged
const KEY_URLS = [
  '/',
  '/motors',
  '/quote',
  '/case-studies',
  '/locations',
  '/agents',
  '/sitemap.xml',
];

export function IndexNowControl() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    ok: boolean;
    submittedCount?: number;
    status?: number;
    error?: string;
    at: string;
  } | null>(null);

  const pingAll = async () => {
    setLoading(true);
    try {
      // Build a fresh URL list: core URLs + active motor detail pages + case studies
      const urls: string[] = KEY_URLS.map((p) => `${SITE}${p}`);

      // Add motor detail URLs
      const { data: motors } = await supabase
        .from('motor_models')
        .select('id, model_key, availability')
        .eq('availability', 'In Stock')
        .limit(200);

      if (motors) {
        for (const m of motors) {
          if (m.model_key) urls.push(`${SITE}/motors/${m.model_key}`);
        }
      }

      // Case studies (static slugs from src/data/caseStudies.ts)
      const caseSlugs = [
        'aluminum-fishing-60-to-90-fourstroke',
        'pontoon-family-40-to-115-command-thrust',
        'bass-boat-150-2stroke-to-pro-xs',
        'cedar-strip-9-9-fourstroke',
        'walkaround-cuddy-90-to-115-efi',
      ];
      for (const slug of caseSlugs) urls.push(`${SITE}/case-studies/${slug}`);

      const { data, error } = await supabase.functions.invoke('indexnow-ping', {
        body: { urls },
      });

      if (error) throw error;

      setLastResult({
        ok: !!data?.ok,
        submittedCount: data?.submittedCount,
        status: data?.status,
        at: new Date().toLocaleString(),
      });

      if (data?.ok) {
        toast.success(`IndexNow ping submitted (${data.submittedCount} URLs)`);
      } else {
        toast.error(`IndexNow ping failed: ${data?.indexNowResponse || 'Unknown error'}`);
      }
    } catch (err: any) {
      setLastResult({
        ok: false,
        error: err?.message || String(err),
        at: new Date().toLocaleString(),
      });
      toast.error(`IndexNow error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          IndexNow Freshness Ping
        </CardTitle>
        <CardDescription>
          Notify Bing & IndexNow-compatible search engines (and AI crawlers that consume the
          IndexNow feed) that the homepage, motor pages, case studies and sitemap have been
          updated. Use after major price/inventory updates or content launches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={pingAll} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pinging…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Re-ping all key URLs
              </>
            )}
          </Button>

          {lastResult && (
            <Badge variant={lastResult.ok ? 'default' : 'destructive'} className="gap-1">
              {lastResult.ok ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {lastResult.ok
                ? `${lastResult.submittedCount} URLs · ${lastResult.at}`
                : `Failed · ${lastResult.at}`}
            </Badge>
          )}
        </div>

        {lastResult?.error && (
          <p className="text-sm text-destructive">{lastResult.error}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Key file:{' '}
          <a
            href={`${SITE}/03999430e4bae3d7d7be108f62646dbf.txt`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            03999430e4bae3d7d7be108f62646dbf.txt
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
