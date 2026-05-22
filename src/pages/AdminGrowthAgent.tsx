import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileSearch,
  Globe2,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AdminNav from "@/components/admin/AdminNav";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

type FindingCategory = "seo" | "links" | "technical" | "geo" | "content";
type FindingSeverity = "critical" | "high" | "medium" | "low";
type FindingStatus = "open" | "approved" | "fixed" | "ignored";
type OwnerLane = "claude_lovable" | "hermes" | "openclaw" | "pc_perplexity" | "codex";

type GrowthFinding = {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  page_url: string;
  details: string;
  recommendation: string;
  owner_lane?: OwnerLane | null;
  evidence?: Record<string, unknown> | null;
  created_at: string;
};

type GrowthRun = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  site_url: string;
  scores: {
    seo?: number;
    links?: number;
    technical?: number;
    geo?: number;
    content?: number;
  } | null;
  summary: {
    pages_checked?: number;
    issue_count?: number;
    next_best_action?: string;
    source?: string;
  } | null;
};

const fallbackRun: GrowthRun = {
  id: "local-seed",
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  status: "completed",
  site_url: SITE_URL,
  scores: { seo: 88, links: 76, technical: 82, geo: 71, content: 79 },
  summary: {
    pages_checked: 7,
    issue_count: 6,
    next_best_action: "Connect Search Console, then prioritize Ontario pricing and AI citation gaps.",
    source: "local-seed",
  },
};

const fallbackFindings: GrowthFinding[] = [
  {
    id: "seed-gsc",
    category: "seo",
    severity: "high",
    status: "open",
    title: "Search Console data is not wired into the growth queue",
    page_url: "https://search.google.com/search-console",
    details: "The agent can crawl the public site now, but query impressions and indexing gaps need the Mercury Repower property connected.",
    recommendation: "Add a Search Console connector so the queue can rank fixes by impressions, clicks, and pages with crawling/indexing friction.",
    owner_lane: "pc_perplexity",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-pricing",
    category: "geo",
    severity: "high",
    status: "open",
    title: "Pricing visibility should stay Ontario and pickup focused",
    page_url: `${SITE_URL}/mercurypricelist`,
    details: "AI answer engines need a clear pricing source, but HBW should not be framed like a Canada-wide shipping dealer.",
    recommendation: "Keep pricing language anchored to Ontario, Gores Landing pickup, CAD pricing, installation, and water testing.",
    owner_lane: "claude_lovable",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-agent-surface",
    category: "geo",
    severity: "medium",
    status: "open",
    title: "Agent-readable surfaces should be checked on every deploy",
    page_url: `${SITE_URL}/agents`,
    details: "The site already has an AI-agent hub, MCP endpoint, public motors API, catalog, and llms.txt. The issue is freshness and verification.",
    recommendation: "Run a daily check against /agents, /llms.txt, /catalog.md, /sitemap.xml, and raw prerendered HTML.",
    owner_lane: "hermes",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-prerender",
    category: "technical",
    severity: "medium",
    status: "open",
    title: "Crawler-visible HTML must be verified outside the React app",
    page_url: SITE_URL,
    details: "Past Mercury fixes have looked correct in React while stale or hardcoded output remained in static prerendered HTML.",
    recommendation: "For title, schema, and agent-hub changes, verify the built HTML or production source, not only the hydrated route.",
    owner_lane: "codex",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-links",
    category: "links",
    severity: "medium",
    status: "open",
    title: "Internal links should promote quote-intent pages first",
    page_url: `${SITE_URL}/blog`,
    details: "Blog posts and language variants can rank, but they should consistently point readers toward quote, pricing, trade-in, and motor pages.",
    recommendation: "Score posts for links to /quote/motor-selection, /mercurypricelist, /trade-in-value, and relevant motor pages.",
    owner_lane: "claude_lovable",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-content",
    category: "content",
    severity: "low",
    status: "open",
    title: "Content queue should prefer HBW-specific assets over generic output",
    page_url: `${SITE_URL}/blog`,
    details: "Generated or wrong-brand visuals are weaker for reader trust, SEO snippets, and AI citation confidence.",
    recommendation: "Flag posts with missing, reused, or non-HBW visual assets and queue real-photo swaps before net-new generic posts.",
    owner_lane: "openclaw",
    created_at: new Date().toISOString(),
  },
];

const categoryMeta: Record<FindingCategory, { label: string; icon: typeof Search; accent: string }> = {
  seo: { label: "SEO", icon: Search, accent: "text-blue-700 bg-blue-50 border-blue-200" },
  links: { label: "Links", icon: Link2, accent: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  technical: { label: "Technical", icon: Code2, accent: "text-orange-700 bg-orange-50 border-orange-200" },
  geo: { label: "GEO", icon: Globe2, accent: "text-violet-700 bg-violet-50 border-violet-200" },
  content: { label: "Content", icon: FileSearch, accent: "text-slate-700 bg-slate-50 border-slate-200" },
};

const severityClass: Record<FindingSeverity, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const laneMeta: Record<OwnerLane, { label: string; description: string; badge: string }> = {
  hermes: {
    label: "Hermes",
    description: "Always-on monitoring, daily queue summaries, and follow-up routing.",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  claude_lovable: {
    label: "Claude/Lovable",
    description: "Site-edit execution, blog/page rewrites, image swaps, and Lovable-ready content changes.",
    badge: "bg-violet-100 text-violet-800 border-violet-200",
  },
  openclaw: {
    label: "OpenClaw",
    description: "Browser, catalogue, image, and local verification work on the right machine.",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  pc_perplexity: {
    label: "PC",
    description: "Google services, Perplexity research, AI citation checks, and research-backed content drafts.",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  codex: {
    label: "Codex",
    description: "Repo patches, migrations, edge functions, builds, and deploy verification.",
    badge: "bg-slate-900 text-white border-slate-900",
  },
};

function scoreValue(run: GrowthRun, key: keyof NonNullable<GrowthRun["scores"]>) {
  return Math.max(0, Math.min(100, Math.round(run.scores?.[key] ?? 0)));
}

function categoryCount(findings: GrowthFinding[], category: FindingCategory) {
  return findings.filter((finding) => finding.category === category && finding.status !== "fixed").length;
}

function isFallbackRun(run: GrowthRun) {
  return run.id === fallbackRun.id;
}

export default function AdminGrowthAgent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FindingCategory | "all">("all");
  const [notes, setNotes] = useState("Focus first on Search Console indexing gaps, Ontario pricing citation gaps, and crawler-visible prerender output.");
  const [runningAudit, setRunningAudit] = useState(false);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["growth-agent-dashboard"],
    queryFn: async () => {
      const { data: runs, error: runError } = await (supabase as any)
        .from("growth_agent_audit_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1);

      if (runError || !runs?.length) {
        return { run: fallbackRun, findings: fallbackFindings, live: false };
      }

      const latestRun = runs[0] as GrowthRun;
      const { data: findings, error: findingsError } = await (supabase as any)
        .from("growth_agent_findings")
        .select("*")
        .eq("run_id", latestRun.id)
        .order("created_at", { ascending: false });

      if (findingsError) {
        return { run: latestRun, findings: fallbackFindings, live: false };
      }

      return {
        run: latestRun,
        findings: (findings || []) as GrowthFinding[],
        live: true,
      };
    },
    refetchInterval: 60000,
  });

  const run = data?.run ?? fallbackRun;
  const findings = data?.findings ?? fallbackFindings;
  const openFindings = findings.filter((finding) => finding.status !== "fixed");
  const filteredFindings = activeTab === "all" ? openFindings : openFindings.filter((finding) => finding.category === activeTab);

  const severityStats = useMemo(() => {
    return openFindings.reduce(
      (acc, finding) => {
        acc[finding.severity] += 1;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 } as Record<FindingSeverity, number>,
    );
  }, [openFindings]);

  const nextBestActions = useMemo(() => {
    return [
      "Hermes watches daily audit deltas, Search Console tasks, and stale queue items.",
      "Claude/Lovable handles approved blog/page rewrites, site copy, image swaps, and implementation prompts.",
      "OpenClaw verifies browser-only, catalogue, media, and machine-bound evidence.",
      "PC handles connected Google services, Perplexity/AI answer visibility, and research-backed content drafting.",
      "Codex owns repo edits, Supabase migrations, edge functions, build gates, and Vercel proof.",
    ];
  }, []);

  const runAudit = async () => {
    setRunningAudit(true);
    try {
      const { error } = await supabase.functions.invoke("growth-agent-audit", {
        body: {
          site_url: SITE_URL,
          mode: "quick",
          operator_notes: notes,
        },
      });

      if (error) throw error;

      toast({
        title: "Growth audit started",
        description: "The agent checked the public site and saved the latest queue.",
      });
      await refetch();
    } catch (error) {
      console.error("[growth-agent] audit failed", error);
      toast({
        title: "Audit runner not available yet",
        description: "The dashboard is using the local seed queue until the Supabase function is deployed.",
        variant: "destructive",
      });
    } finally {
      setRunningAudit(false);
    }
  };

  const markStatus = async (finding: GrowthFinding, status: FindingStatus) => {
    if (isFallbackRun(run)) {
      toast({
        title: "Connect database first",
        description: "Seed findings are read-only until the growth-agent migration is applied.",
      });
      return;
    }

    const { error } = await (supabase as any)
      .from("growth_agent_findings")
      .update({ status })
      .eq("id", finding.id);

    if (error) {
      toast({
        title: "Could not update finding",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Finding updated",
      description: `${finding.title} marked ${status}.`,
    });
    await refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Bot className="h-4 w-4" />
              Mercury Repower Growth Agent
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">SEO, GEO, and deploy verification queue</h1>
            <p className="text-sm leading-6 text-slate-600">
              A Mercury-specific version of the AI CMO loop: crawl the live site, find crawler-visible issues,
              rank work by business value, and keep fixes approval-based.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading || runningAudit}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={runAudit} disabled={runningAudit}>
              {runningAudit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Run Audit
            </Button>
          </div>
        </section>

        {!data?.live && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Showing the built-in starter queue. Apply the Supabase migration and deploy the growth-agent-audit function
              to persist real crawl findings.
            </AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {(["seo", "links", "technical", "geo", "content"] as const).map((key) => {
            const Icon = categoryMeta[key].icon;
            const score = scoreValue(run, key);
            return (
              <Card key={key} className="border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Icon className="h-4 w-4" />
                      {categoryMeta[key].label}
                    </div>
                    <Badge variant="outline">{categoryCount(openFindings, key)} open</Badge>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="text-3xl font-semibold text-slate-950">{score}</span>
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                  <Progress value={score} className="mt-3 h-2" />
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Fix Queue</CardTitle>
                  <CardDescription>
                    Latest scan of {run.site_url}. {run.completed_at ? `Completed ${formatDistanceToNow(new Date(run.completed_at), { addSuffix: true })}.` : "Running now."}
                  </CardDescription>
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge className={severityClass.high}>{severityStats.critical + severityStats.high} urgent</Badge>
                  <Badge variant="outline">{openFindings.length} open</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FindingCategory | "all")}>
                <TabsList className="mb-4 flex w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="links">Links</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="geo">GEO</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="m-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Issue</TableHead>
                          <TableHead className="w-[130px]">Category</TableHead>
                        <TableHead className="w-[140px]">Owner</TableHead>
                        <TableHead className="w-[110px]">Severity</TableHead>
                        <TableHead className="w-[150px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFindings.map((finding) => (
                        <TableRow key={finding.id} className="align-top">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-slate-950">{finding.title}</div>
                              <div className="text-sm text-slate-600">{finding.details}</div>
                              <div className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">{finding.recommendation}</div>
                              <a
                                href={finding.page_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                              >
                                {finding.page_url.replace(SITE_URL, "") || "/"}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={categoryMeta[finding.category].accent}>
                              {categoryMeta[finding.category].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {finding.owner_lane ? (
                              <Badge className={laneMeta[finding.owner_lane].badge}>
                                {laneMeta[finding.owner_lane].label}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Unrouted</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={severityClass[finding.severity]}>{finding.severity}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button size="sm" variant="outline" onClick={() => markStatus(finding, "approved")}>
                                Approve
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => markStatus(finding, "ignored")}>
                                Ignore
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Shared Agent Lanes
                </CardTitle>
                <CardDescription>How findings move into the existing operator stack.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(laneMeta) as OwnerLane[]).map((lane) => (
                  <div key={lane} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge className={laneMeta[lane].badge}>{laneMeta[lane].label}</Badge>
                      <span className="text-xs text-slate-500">
                        {openFindings.filter((finding) => finding.owner_lane === lane).length} open
                      </span>
                    </div>
                    <p className="text-sm leading-5 text-slate-700">{laneMeta[lane].description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle>Agent Feed</CardTitle>
                <CardDescription>What the loop is watching first.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nextBestActions.map((action) => (
                  <div key={action} className="flex gap-2 text-sm leading-5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{action}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Run Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pages checked</span>
                  <span className="font-medium text-slate-950">{run.summary?.pages_checked ?? "unknown"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Issues found</span>
                  <span className="font-medium text-slate-950">{run.summary?.issue_count ?? openFindings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge variant={run.status === "completed" ? "outline" : "secondary"}>
                    {run.status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {run.status}
                  </Badge>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-700">
                  {run.summary?.next_best_action || "No next action recorded yet."}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle>Operator Notes</CardTitle>
                <CardDescription>Passed into the audit runner for context.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[130px]"
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
