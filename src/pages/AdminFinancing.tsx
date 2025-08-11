
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Removed Database type import because the table isn't in generated types yet
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import FinancingForm, { FinancingFormValues } from "@/components/admin/FinancingForm";
// Removed unused Label import
import { toast } from "sonner";

// Temporary local type until Supabase types are regenerated
type FinancingOption = {
  id: string;
  name: string;
  rate: number;
  term_months: number;
  min_amount: number;
  is_promo: boolean | null;
  promo_text: string | null;
  promo_end_date: string | null; // date string 'YYYY-MM-DD'
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function AdminFinancing() {
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<FinancingOption | null>(null);
  const [filter, setFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["financing_options", "all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("financing_options")
        .select("*")
        .order("display_order", { ascending: true })
        .order("term_months", { ascending: true });
      if (error) throw error;
      return data as FinancingOption[];
    },
  });

  const filtered = useMemo(() => {
    const f = (filter || "").toLowerCase();
    if (!data) return [];
    if (!f) return data;
    return data.filter((row) => row.name.toLowerCase().includes(f));
  }, [data, filter]);

  const handleCreate = async (values: FinancingFormValues) => {
    const payload = {
      ...values,
      promo_text: values.is_promo ? values.promo_text || null : null,
      promo_end_date: values.is_promo && values.promo_end_date ? values.promo_end_date : null,
    };

    const { error } = await (supabase as any).from("financing_options").insert(payload);
    if (error) {
      console.error("Create financing option failed:", error);
      toast.error("Failed to create option");
      return;
    }
    toast.success("Financing option created");
    setOpenCreate(false);
    qc.invalidateQueries({ queryKey: ["financing_options", "all"] });
  };

  const handleUpdate = async (id: string, values: FinancingFormValues) => {
    const payload = {
      ...values,
      promo_text: values.is_promo ? values.promo_text || null : null,
      promo_end_date: values.is_promo && values.promo_end_date ? values.promo_end_date : null,
    };

    const { error } = await (supabase as any).from("financing_options").update(payload).eq("id", id);
    if (error) {
      console.error("Update financing option failed:", error);
      toast.error("Failed to update option");
      return;
    }
    toast.success("Financing option updated");
    setEditTarget(null);
    qc.invalidateQueries({ queryKey: ["financing_options", "all"] });
  };

  const handleDelete = async (row: FinancingOption) => {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    const { error } = await (supabase as any).from("financing_options").delete().eq("id", row.id);
    if (error) {
      console.error("Delete financing option failed:", error);
      toast.error("Failed to delete option");
      return;
    }
    toast.success("Financing option deleted");
    qc.invalidateQueries({ queryKey: ["financing_options", "all"] });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Financing Options</CardTitle>
            <CardDescription>
              Configure rates, terms, minimum amount thresholds, and promo messaging used in calculators and quotes.
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Filter by name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-48"
            />
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>Create Option</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Financing Option</DialogTitle>
                  <DialogDescription>Add a new rate and term configuration.</DialogDescription>
                </DialogHeader>
                <FinancingForm onSubmit={handleCreate} submitLabel="Create" />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <div>Loading...</div>}
          {error && (
            <div className="text-destructive">
              Failed to load options. Make sure you are signed in.
            </div>
          )}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Min Amount</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.display_order}</TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="font-medium">{row.name}</div>
                        {row.promo_text && (
                          <div className="text-muted-foreground text-sm line-clamp-2">
                            {row.promo_text}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{Number(row.rate).toFixed(2)}%</TableCell>
                      <TableCell>{row.term_months} mo</TableCell>
                      <TableCell>${Number(row.min_amount).toLocaleString()}</TableCell>
                      <TableCell>{row.is_promo ? "Yes" : "No"}</TableCell>
                      <TableCell>{row.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={!!editTarget && editTarget.id === row.id} onOpenChange={(o) => !o && setEditTarget(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditTarget(row)}>Edit</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Financing Option</DialogTitle>
                              <DialogDescription>Update rate, term, thresholds and promo details.</DialogDescription>
                            </DialogHeader>
                            <FinancingForm
                              defaultValues={{
                                name: row.name || "",
                                rate: Number(row.rate),
                                term_months: row.term_months,
                                min_amount: Number(row.min_amount),
                                is_promo: row.is_promo ?? false,
                                promo_text: row.promo_text ?? "",
                                promo_end_date: row.promo_end_date ?? undefined,
                                is_active: row.is_active ?? true,
                                display_order: row.display_order ?? 0,
                              }}
                              onSubmit={(vals) => handleUpdate(row.id, vals)}
                              submitLabel="Update"
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDelete(row)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No options found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="text-sm text-muted-foreground mt-3">
                Tip: Use Display Order to control the order options appear in selectors and calculators.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
