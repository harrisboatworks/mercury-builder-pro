
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Promotion {
  id: string;
  name: string;
  discount_percentage: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  stackable: boolean;
  created_at?: string;
  // Bonus/metadata
  kind: 'discount' | 'bonus';
  bonus_title: string | null;
  bonus_short_badge: string | null;
  bonus_description: string | null;
  warranty_extra_years: number | null;
  terms_url: string | null;
  highlight: boolean;
  priority: number;
}

interface PromotionRule {
  id: string;
  promotion_id: string;
  rule_type: 'all' | 'model' | 'motor_type' | 'horsepower_range';
  model: string | null;
  motor_type: string | null;
  horsepower_min: number | null;
  horsepower_max: number | null;
}

const AdminPromotions = () => {
  const { toast } = useToast();

  // SEO
  useEffect(() => {
    document.title = 'Promotions Manager | Admin';
    const desc = document.querySelector('meta[name="description"]');
    const canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!desc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Manage discounts and bonus promotions for Mercury outboards.';
      document.head.appendChild(m);
    }
    if (!canonical) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = window.location.href;
      document.head.appendChild(link);
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [rules, setRules] = useState<PromotionRule[]>([]);

  // New promotion form
  const [newPromo, setNewPromo] = useState<Omit<Promotion, 'id'>>({
    name: '',
    discount_percentage: 5,
    is_active: true,
    stackable: false,
    start_date: null,
    end_date: null,
    // New fields
    kind: 'discount',
    bonus_title: null,
    bonus_short_badge: null,
    bonus_description: null,
    warranty_extra_years: null,
    terms_url: null,
    highlight: false,
    priority: 0,
  });

  // New rule form
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Omit<PromotionRule, 'id'>>({
    promotion_id: '',
    rule_type: 'all',
    model: null,
    motor_type: null,
    horsepower_min: null,
    horsepower_max: null,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: promos, error: pErr }, { data: rls, error: rErr }] = await Promise.all([
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('promotions_rules').select('*'),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      setPromotions(promos as Promotion[]);
      setRules(rls as PromotionRule[]);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load promotions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createPromotion = async () => {
    try {
      const payload = {
        ...newPromo,
        // If it's a bonus, ensure discount is 0
        discount_percentage: newPromo.kind === 'bonus' ? 0 : Number(newPromo.discount_percentage || 0),
      };
      const { data, error } = await supabase.from('promotions').insert(payload).select('*').single();
      if (error) throw error;
      toast({ title: 'Promotion created', description: `${data.name} (${data.kind})` });
      setNewPromo({
        name: '',
        discount_percentage: 5,
        is_active: true,
        stackable: false,
        start_date: null,
        end_date: null,
        kind: 'discount',
        bonus_title: null,
        bonus_short_badge: null,
        bonus_description: null,
        warranty_extra_years: null,
        terms_url: null,
        highlight: false,
        priority: 0,
      });
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to create promotion', variant: 'destructive' });
    }
  };

  const updatePromotion = async (id: string, patch: Partial<Promotion>) => {
    try {
      const { error } = await supabase.from('promotions').update(patch).eq('id', id);
      if (error) throw error;
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to update promotion', variant: 'destructive' });
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to delete promotion', variant: 'destructive' });
    }
  };

  const createRule = async () => {
    if (!selectedPromoId) return;
    const payload = { ...newRule, promotion_id: selectedPromoId };
    try {
      const { error } = await supabase.from('promotions_rules').insert(payload);
      if (error) throw error;
      toast({ title: 'Rule added', description: 'Promotion rule saved' });
      setNewRule({ promotion_id: selectedPromoId, rule_type: 'all', model: null, motor_type: null, horsepower_min: null, horsepower_max: null });
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to add rule', variant: 'destructive' });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase.from('promotions_rules').delete().eq('id', id);
      if (error) throw error;
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  const rulesByPromo = useMemo(() => {
    const map: Record<string, PromotionRule[]> = {};
    for (const r of rules) {
      map[r.promotion_id] = map[r.promotion_id] || [];
      map[r.promotion_id].push(r);
    }
    return map;
  }, [rules]);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Promotions Manager</h1>
        <p className="text-muted-foreground">Create sales and bonus promos. Assign rules by model, motor type, or HP range.</p>
      </header>

      {/* Create Promotion */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Promotion</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kind">Type</Label>
            <Select value={newPromo.kind} onValueChange={(v: Promotion['kind']) => setNewPromo({ ...newPromo, kind: v })}>
              <SelectTrigger id="kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Discount</SelectItem>
                <SelectItem value="bonus">Bonus Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={newPromo.name} onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })} placeholder="Spring Bonus" />
          </div>
          {newPromo.kind === 'discount' && (
            <div className="space-y-2">
              <Label htmlFor="discount">Discount %</Label>
              <Input id="discount" type="number" value={newPromo.discount_percentage}
                onChange={(e) => setNewPromo({ ...newPromo, discount_percentage: Number(e.target.value) })} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="start">Start Date</Label>
            <Input id="start" type="date" value={newPromo.start_date ?? ''}
              onChange={(e) => setNewPromo({ ...newPromo, start_date: e.target.value || null })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End Date</Label>
            <Input id="end" type="date" value={newPromo.end_date ?? ''}
              onChange={(e) => setNewPromo({ ...newPromo, end_date: e.target.value || null })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={newPromo.is_active} onCheckedChange={(v) => setNewPromo({ ...newPromo, is_active: v })} />
            <Label>Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={newPromo.stackable} onCheckedChange={(v) => setNewPromo({ ...newPromo, stackable: v })} />
            <Label>Stackable</Label>
          </div>
          {newPromo.kind === 'bonus' && (
            <>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bonus_title">Bonus Title</Label>
                <Input id="bonus_title" value={newPromo.bonus_title ?? ''} onChange={(e) => setNewPromo({ ...newPromo, bonus_title: e.target.value })} placeholder="+2 Years Extended Warranty" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus_badge">Badge Text</Label>
                <Input id="bonus_badge" value={newPromo.bonus_short_badge ?? ''} onChange={(e) => setNewPromo({ ...newPromo, bonus_short_badge: e.target.value })} placeholder="+2Y Warranty" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="bonus_desc">Bonus Description</Label>
                <Input id="bonus_desc" value={newPromo.bonus_description ?? ''} onChange={(e) => setNewPromo({ ...newPromo, bonus_description: e.target.value })} placeholder="Added value at no extra cost to the buyer." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_years">Extra Warranty (years)</Label>
                <Input id="warranty_years" type="number" value={newPromo.warranty_extra_years ?? ''} onChange={(e) => setNewPromo({ ...newPromo, warranty_extra_years: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="terms_url">Terms URL</Label>
                <Input id="terms_url" value={newPromo.terms_url ?? ''} onChange={(e) => setNewPromo({ ...newPromo, terms_url: e.target.value })} placeholder="https://www.mercurymarine.com/..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newPromo.highlight} onCheckedChange={(v) => setNewPromo({ ...newPromo, highlight: v })} />
                <Label>Highlight</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" type="number" value={newPromo.priority} onChange={(e) => setNewPromo({ ...newPromo, priority: Number(e.target.value || 0) })} />
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <Button onClick={createPromotion}>Create Promotion</Button>
        </div>
      </Card>

      {/* Promotions List */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading promotions…</p>
        ) : promotions.length === 0 ? (
          <Card className="p-6">No promotions yet.</Card>
        ) : (
          promotions.map((p) => (
            <Card key={p.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    {p.name}{' '}
                    <Badge variant={p.is_active ? 'default' : 'outline'}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>{' '}
                    <Badge variant={p.kind === 'bonus' ? 'secondary' : 'outline'}>
                      {p.kind === 'bonus' ? 'Bonus Offer' : 'Discount'}
                    </Badge>
                    {p.highlight && <Badge className="ml-2">Highlighted</Badge>}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {p.kind === 'discount' ? (
                      <span>{p.discount_percentage}% off</span>
                    ) : (
                      <>
                        {p.warranty_extra_years ? <span>+{p.warranty_extra_years} Years Warranty</span> : <span>Bonus Offer</span>}
                        {p.bonus_short_badge && <span className="ml-2">• {p.bonus_short_badge}</span>}
                      </>
                    )}
                    {p.start_date && <span className="ml-2">• Starts {new Date(p.start_date).toLocaleDateString()}</span>}
                    {p.end_date && <span className="ml-2">• Ends {new Date(p.end_date).toLocaleDateString()}</span>}
                    {p.terms_url && <span className="ml-2">• <a href={p.terms_url} target="_blank" rel="noreferrer" className="underline">Terms</a></span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => updatePromotion(p.id, { is_active: !p.is_active })}>{p.is_active ? 'Deactivate' : 'Activate'}</Button>
                  <Button variant="outline" onClick={() => updatePromotion(p.id, { stackable: !p.stackable })}>{p.stackable ? 'Unstack' : 'Make Stackable'}</Button>
                  <Button variant="destructive" onClick={() => deletePromotion(p.id)}>Delete</Button>
                </div>
              </div>

              {/* Rules */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Rules</h4>
                <div className="space-y-2">
                  {(rulesByPromo[p.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rules yet.</p>
                  ) : (
                    (rulesByPromo[p.id] || []).map((r) => (
                      <div key={r.id} className="flex items-center justify-between border border-border rounded p-2">
                        <div className="text-sm">
                          <span className="font-medium">{r.rule_type}</span>
                          {r.rule_type === 'model' && r.model && <span className="ml-2">• {r.model}</span>}
                          {r.rule_type === 'motor_type' && r.motor_type && <span className="ml-2">• {r.motor_type}</span>}
                          {r.rule_type === 'horsepower_range' && <span className="ml-2">• {r.horsepower_min ?? 0} - {r.horsepower_max ?? '∞'} HP</span>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(r.id)}>Remove</Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Rule */}
                <div className="mt-4 border border-dashed rounded p-4">
                  <h5 className="font-medium mb-2">Add Rule</h5>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-2">
                      <Label>Promotion</Label>
                      <Select value={selectedPromoId ?? p.id} onValueChange={(v) => setSelectedPromoId(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select promotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {promotions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rule Type</Label>
                      <Select value={newRule.rule_type} onValueChange={(v: PromotionRule['rule_type']) => setNewRule({ ...newRule, rule_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Motors</SelectItem>
                          <SelectItem value="model">By Model (contains)</SelectItem>
                          <SelectItem value="motor_type">By Motor Type</SelectItem>
                          <SelectItem value="horsepower_range">By HP Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newRule.rule_type === 'model' && (
                      <div className="space-y-2">
                        <Label>Model contains</Label>
                        <Input value={newRule.model ?? ''} onChange={(e) => setNewRule({ ...newRule, model: e.target.value, motor_type: null, horsepower_min: null, horsepower_max: null })} placeholder="Pro XS" />
                      </div>
                    )}
                    {newRule.rule_type === 'motor_type' && (
                      <div className="space-y-2">
                        <Label>Motor Type</Label>
                        <Input value={newRule.motor_type ?? ''} onChange={(e) => setNewRule({ ...newRule, motor_type: e.target.value, model: null, horsepower_min: null, horsepower_max: null })} placeholder="Verado" />
                      </div>
                    )}
                    {newRule.rule_type === 'horsepower_range' && (
                      <div className="flex gap-2 items-end">
                        <div className="space-y-2">
                          <Label>Min HP</Label>
                          <Input type="number" value={newRule.horsepower_min ?? ''} onChange={(e) => setNewRule({ ...newRule, horsepower_min: Number(e.target.value || 0), model: null, motor_type: null })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Max HP</Label>
                          <Input type="number" value={newRule.horsepower_max ?? ''} onChange={(e) => setNewRule({ ...newRule, horsepower_max: Number(e.target.value || 0), model: null, motor_type: null })} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-end">
                      <Button onClick={createRule}>Add Rule</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
};

export default AdminPromotions;
