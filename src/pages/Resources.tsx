import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, Link2, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RepowerHeader } from "@/components/repower/RepowerHeader";
import { SiteFooter } from "@/components/ui/site-footer";
import { NoIndex } from "@/components/seo/NoIndex";
import { Helmet } from "@/lib/helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SiteDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_size_label: string | null;
  sort_order: number | null;
}

const PRIMARY_CATEGORIES: { name: string; anchor: string }[] = [
  { name: "New Owner Resources", anchor: "new-owner" },
  { name: "Mercury Official Documents", anchor: "mercury-official" },
  { name: "HBW Reference & Guides", anchor: "hbw-reference" },
];

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(?:[?#]|$)/i.test(url);
}

export default function Resources() {
  const [documents, setDocuments] = useState<SiteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("site_documents")
        .select(
          "id, title, description, category, file_url, file_size_label, sort_order",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("title", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("[Resources] failed to load site_documents", error);
        setDocuments([]);
      } else {
        setDocuments((data as SiteDocument[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = new Map<string, SiteDocument[]>();
  for (const cat of PRIMARY_CATEGORIES) grouped.set(cat.name, []);
  for (const doc of documents) {
    const arr = grouped.get(doc.category) ?? [];
    arr.push(doc);
    grouped.set(doc.category, arr);
  }

  const primaryNames = new Set(PRIMARY_CATEGORIES.map((c) => c.name));
  const extraCategories = Array.from(grouped.keys())
    .filter((n) => !primaryNames.has(n))
    .sort((a, b) => a.localeCompare(b));

  const orderedCategories = [
    ...PRIMARY_CATEGORIES,
    ...extraCategories.map((name) => ({ name, anchor: slugifyCategory(name) })),
  ];

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="min-h-screen bg-repower-paper">
      <NoIndex />
      <Helmet>
        <title>Documents & Downloads | Harris Boat Works</title>
        <meta
          name="description"
          content="Official Mercury documents, owner guides, and Harris Boat Works reference files. Free to open, download and share."
        />
      </Helmet>
      <RepowerHeader />

      <main className="pt-[64px] lg:pt-[72px]">
        <div className="container mx-auto px-6 md:px-14 pt-6 max-w-[960px]">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/"
                    className="text-repower-navy-900/60 hover:text-repower-mercury-red"
                  >
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-repower-navy-900/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-repower-navy-900">
                  Documents & Downloads
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className="container mx-auto px-6 md:px-14 max-w-[960px] pt-8 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-repower-navy-900 mb-3">
            Documents & Downloads
          </h1>
          <p className="text-repower-navy-900/70 text-base md:text-lg">
            Official Mercury documents, owner guides, and Harris Boat Works
            reference files. Free to open, download and share.
          </p>
        </section>

        <div className="container mx-auto px-6 md:px-14 max-w-[960px] pb-20 space-y-12">
          {loading ? (
            <p className="text-repower-navy-900/60">Loading documents…</p>
          ) : (
            orderedCategories.map(({ name, anchor }) => {
              const docs = grouped.get(name) ?? [];
              return (
                <section key={anchor} id={anchor} className="scroll-mt-28">
                  <h2 className="text-2xl font-semibold text-repower-navy-900 mb-4 border-b border-repower-navy-900/10 pb-2">
                    {name}
                  </h2>
                  {docs.length === 0 ? (
                    <p className="text-sm text-repower-navy-900/50 italic">
                      Documents coming soon.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {docs.map((doc) => {
                        const isPdf = isPdfUrl(doc.file_url);
                        return (
                          <Card
                            key={doc.id}
                            className="border-repower-navy-900/10"
                          >
                            <CardContent className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <FileText className="w-5 h-5 mt-0.5 text-repower-mercury-red shrink-0" />
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-repower-navy-900 leading-snug">
                                    {doc.title}
                                  </h3>
                                  {doc.description && (
                                    <p className="text-sm text-repower-navy-900/70 mt-1">
                                      {doc.description}
                                    </p>
                                  )}
                                  {doc.file_size_label && (
                                    <p className="text-xs text-repower-navy-900/50 mt-1">
                                      {doc.file_size_label}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 md:shrink-0">
                                <Button asChild size="sm" className="gap-2">
                                  <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {isPdf ? (
                                      <Download className="w-4 h-4" />
                                    ) : (
                                      <ExternalLink className="w-4 h-4" />
                                    )}
                                    {isPdf
                                      ? "Download PDF"
                                      : "Open Official Resource"}
                                  </a>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label="Copy link"
                                  onClick={() => copyLink(doc.file_url)}
                                >
                                  <Link2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
