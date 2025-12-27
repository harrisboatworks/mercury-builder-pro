import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import FinancingForm, { FinancingFormValues } from '@/components/admin/FinancingForm';
import { toast } from 'sonner';
import AdminNav from '@/components/admin/AdminNav';
import { Mic, CheckCircle2, AlertCircle } from 'lucide-react';
interface DbMotor {
  id: string;
  model: string;
  horsepower: number;
  motor_type: string;
}

interface Promotion {
  id: string;
  name: string;
  discount_percentage: number;
  discount_fixed_amount: number;
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
  details?: any;
  // Image fields
  image_url: string | null;
  image_alt_text: string | null;
}

interface PromotionRule {
  id: string;
  promotion_id: string;
  rule_type: 'all' | 'model' | 'motor_type' | 'horsepower_range';
  model: string | null;
  motor_type: string | null;
  horsepower_min: number | null;
  horsepower_max: number | null;
  // NEW: rule-level discount overrides
  discount_percentage: number;
  discount_fixed_amount: number;
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
  const [motors, setMotors] = useState<DbMotor[]>([]);

  // New promotion form
  const [newPromo, setNewPromo] = useState<Omit<Promotion, 'id'>>({
    name: '',
    discount_percentage: 5,
    discount_fixed_amount: 0,
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
    // Image fields
    image_url: null,
    image_alt_text: null,
  });

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  // NEW: rule-level discount UI state
  const [ruleDiscountType, setRuleDiscountType] = useState<'inherit' | 'percentage' | 'fixed'>('inherit');
  const [ruleDiscountValue, setRuleDiscountValue] = useState<number>(0);

  // New rule form
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Omit<PromotionRule, 'id'>>({
    promotion_id: '',
    rule_type: 'all',
    model: null,
    motor_type: null,
    horsepower_min: null,
    horsepower_max: null,
    // NEW: default overrides to 0 (inherit promo)
    discount_percentage: 0,
    discount_fixed_amount: 0,
  });

  // State for inline date editing
  const [editingDates, setEditingDates] = useState<Record<string, { start_date: string, end_date: string }>>({});

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { data: promos, error: pErr },
        { data: rls, error: rErr },
        { data: motorsData, error: mErr }
      ] = await Promise.all([
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('promotions_rules').select('*'),
        supabase.from('motor_models').select('id, model, horsepower, motor_type'),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      if (mErr) throw mErr;
      setPromotions(promos as Promotion[]);
      setRules(rls as PromotionRule[]);
      setMotors((motorsData as any[]).map(m => ({ id: m.id, model: m.model, horsepower: Number(m.horsepower), motor_type: m.motor_type })) as DbMotor[]);
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

  // Realtime updates: auto-refresh when promotions or rules change
  useEffect(() => {
    const channel = supabase
      .channel('admin-promos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions_rules' }, () => loadAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createPromotion = async () => {
    try {
      const payload: Omit<Promotion, 'id'> = { ...newPromo } as Omit<Promotion, 'id'>;
      // If it's a bonus, ensure both discounts are 0
      if (newPromo.kind === 'bonus') {
        payload.discount_percentage = 0;
        payload.discount_fixed_amount = 0;
      } else {
        if (discountType === 'percentage') {
          payload.discount_fixed_amount = 0;
          payload.discount_percentage = Number(newPromo.discount_percentage || 0);
        } else {
          payload.discount_percentage = 0;
          payload.discount_fixed_amount = Number(newPromo.discount_fixed_amount || 0);
        }
      }
      const { data, error } = await supabase.from('promotions').insert(payload).select('*').single();
      if (error) throw error;
      toast({ title: 'Promotion created', description: `${data.name} (${data.kind})` });
      setNewPromo({
        name: '',
        discount_percentage: 5,
        discount_fixed_amount: 0,
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
        image_url: null,
        image_alt_text: null,
      });
      setDiscountType('percentage');
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

  // Helper function to get promotion status
  const getPromotionStatus = (promo: Promotion): 'active' | 'expired' | 'future' | 'inactive' => {
    if (!promo.is_active) return 'inactive';
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (promo.start_date) {
      const startDate = new Date(promo.start_date);
      if (startDate > now) return 'future';
    }
    
    if (promo.end_date) {
      const endDate = new Date(promo.end_date);
      if (endDate < now) return 'expired';
    }
    
    return 'active';
  };

  // Quick renewal functions
  const extendPromotion = async (id: string, days: number) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);
    
    await updatePromotion(id, {
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_active: true
    });
    
    toast({ title: 'Promotion Extended', description: `Extended for ${days} days` });
  };

  const renewPromotion = async (id: string) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 90); // Default 90 days
    
    await updatePromotion(id, {
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_active: true
    });
    
    toast({ title: 'Promotion Renewed', description: 'Renewed for 90 days from today' });
  };

  // Save inline date edits
  const saveDateEdit = async (id: string) => {
    const dates = editingDates[id];
    if (!dates) return;
    
    await updatePromotion(id, {
      start_date: dates.start_date || null,
      end_date: dates.end_date || null
    });
    
    // Clear editing state
    const newEditing = { ...editingDates };
    delete newEditing[id];
    setEditingDates(newEditing);
    
    toast({ title: 'Dates Updated', description: 'Promotion dates saved' });
  };

  // Cancel date edit
  const cancelDateEdit = (id: string) => {
    const newEditing = { ...editingDates };
    delete newEditing[id];
    setEditingDates(newEditing);
  };

  // Start editing dates
  const startDateEdit = (promo: Promotion) => {
    setEditingDates({
      ...editingDates,
      [promo.id]: {
        start_date: promo.start_date || '',
        end_date: promo.end_date || ''
      }
    });
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

  const createRule = async (fallbackPromotionId?: string) => {
    const promotionId = selectedPromoId ?? fallbackPromotionId;
    if (!promotionId) {
      toast({ title: 'Select a promotion', description: 'Choose which promotion to attach this rule to.', variant: 'destructive' });
      return;
    }

    // Build payload with optional rule-level overrides
    const payload: Omit<PromotionRule, 'id'> = {
      ...newRule,
      promotion_id: promotionId,
      discount_percentage: ruleDiscountType === 'percentage' ? Number(ruleDiscountValue || 0) : 0,
      discount_fixed_amount: ruleDiscountType === 'fixed' ? Number(ruleDiscountValue || 0) : 0,
    };

    try {
      const { error } = await supabase.from('promotions_rules').insert(payload);
      if (error) throw error;
      toast({ title: 'Rule added', description: 'Promotion rule saved' });
      setNewRule({
        promotion_id: promotionId,
        rule_type: 'all',
        model: null,
        motor_type: null,
        horsepower_min: null,
        horsepower_max: null,
        discount_percentage: 0,
        discount_fixed_amount: 0,
      });
      setRuleDiscountType('inherit');
      setRuleDiscountValue(0);
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

  const ruleMatches = (m: DbMotor, r: PromotionRule) => {
    if (r.rule_type === 'all') return true;
    if (r.rule_type === 'model') return !!r.model && m.model.toLowerCase().includes(r.model.toLowerCase());
    if (r.rule_type === 'motor_type') return !!r.motor_type && m.motor_type.toLowerCase() === r.motor_type.toLowerCase();
    if (r.rule_type === 'horsepower_range') {
      const hp = Number(m.horsepower);
      const min = r.horsepower_min != null ? Number(r.horsepower_min) : -Infinity;
      const max = r.horsepower_max != null ? Number(r.horsepower_max) : Infinity;
      return hp >= min && hp <= max;
    }
    return false;
  };

  const coverageByPromo = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of promotions) {
      const prules = rules.filter(r => r.promotion_id === p.id);
      if (prules.length === 0) {
        map[p.id] = 0;
        continue;
      }
      map[p.id] = motors.filter(m => prules.some(r => ruleMatches(m, r))).length;
    }
    return map;
  }, [promotions, rules, motors]);

  // Count active promotions for voice agent display
  const activePromotionsForVoice = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return promotions.filter(promo => {
      if (!promo.is_active) return false;
      if (promo.start_date && new Date(promo.start_date) > now) return false;
      if (promo.end_date && new Date(promo.end_date) < now) return false;
      return true;
    });
  }, [promotions]);

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminNav />
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Promotions Manager</h1>
        <p className="text-muted-foreground">Create sales and bonus promos. Assign rules by model, motor type, or HP range.</p>
      </header>

      {/* Voice Agent Knowledge Status */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Voice Agent Knowledge</CardTitle>
          </div>
          <CardDescription>
            Active promotions are automatically synced to the voice agent when conversations start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              {activePromotionsForVoice.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm font-medium">
                {activePromotionsForVoice.length} active promotion{activePromotionsForVoice.length !== 1 ? 's' : ''} synced
              </span>
            </div>
            
            {activePromotionsForVoice.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activePromotionsForVoice.slice(0, 5).map(promo => (
                  <Badge key={promo.id} variant="secondary" className="text-xs">
                    {promo.name}
                    {promo.kind === 'discount' && promo.discount_percentage > 0 && ` (${promo.discount_percentage}% off)`}
                    {promo.kind === 'discount' && promo.discount_fixed_amount > 0 && ` ($${promo.discount_fixed_amount} off)`}
                    {promo.kind === 'bonus' && promo.bonus_short_badge && ` (${promo.bonus_short_badge})`}
                  </Badge>
                ))}
                {activePromotionsForVoice.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{activePromotionsForVoice.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            The voice agent can tell customers about these promotions during conversations. 
            Changes take effect on the next voice chat session.
          </p>
        </CardContent>
      </Card>

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
            <>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {discountType === 'percentage' ? (
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount %</Label>
                  <Input id="discount" type="number" value={newPromo.discount_percentage}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_percentage: Number(e.target.value) })} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="discount_fixed">Discount $</Label>
                  <Input id="discount_fixed" type="number" value={newPromo.discount_fixed_amount}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_fixed_amount: Number(e.target.value) })} />
                </div>
              )}
            </>
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
          
          {/* Image Upload Section */}
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="image_url">Promotion Image URL</Label>
            <Input 
              id="image_url" 
              value={newPromo.image_url ?? ''} 
              onChange={(e) => setNewPromo({ ...newPromo, image_url: e.target.value })} 
              placeholder="https://example.com/promo-image.jpg" 
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="image_alt">Image Alt Text</Label>
            <Input 
              id="image_alt" 
              value={newPromo.image_alt_text ?? ''} 
              onChange={(e) => setNewPromo({ ...newPromo, image_alt_text: e.target.value })} 
              placeholder="Descriptive text for screen readers" 
            />
          </div>
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
                    {(() => {
                      const status = getPromotionStatus(p);
                      return (
                        <Badge variant={
                          status === 'active' ? 'default' : 
                          status === 'expired' ? 'destructive' : 
                          status === 'future' ? 'secondary' : 'outline'
                        }>
                          {status === 'active' ? 'Active' : 
                           status === 'expired' ? 'Expired' : 
                           status === 'future' ? 'Future' : 'Inactive'}
                        </Badge>
                      );
                    })()} {' '}
                    <Badge variant={p.kind === 'bonus' ? 'secondary' : 'outline'}>
                      {p.kind === 'bonus' ? 'Bonus Offer' : 'Discount'}
                    </Badge>
                    <Badge className="ml-2" variant={(coverageByPromo[p.id] ?? 0) > 0 ? 'default' : 'outline'}>
                      Applies to {(coverageByPromo[p.id] ?? 0)} motors
                    </Badge>
                    {p.highlight && <Badge className="ml-2">Highlighted</Badge>}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {p.kind === 'discount' ? (
                      <span>
                        {Number((p as any).discount_fixed_amount) > 0
                          ? `$${Number((p as any).discount_fixed_amount).toLocaleString()} off`
                          : `${Number(p.discount_percentage)}% off`}
                      </span>
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

                  {/* Inline Date Editing */}
                  {editingDates[p.id] ? (
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <div className="flex gap-2 items-center">
                        <Label className="text-xs">Start:</Label>
                         <Input
                           type="date"
                           className="w-32"
                           value={editingDates[p.id].start_date}
                           onChange={(e) => setEditingDates({
                             ...editingDates,
                             [p.id]: { ...editingDates[p.id], start_date: e.target.value }
                           })}
                         />
                      </div>
                      <div className="flex gap-2 items-center">
                        <Label className="text-xs">End:</Label>
                         <Input
                           type="date"
                           className="w-32"
                           value={editingDates[p.id].end_date}
                           onChange={(e) => setEditingDates({
                             ...editingDates,
                             [p.id]: { ...editingDates[p.id], end_date: e.target.value }
                           })}
                         />
                      </div>
                      <Button size="sm" onClick={() => saveDateEdit(p.id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => cancelDateEdit(p.id)}>Cancel</Button>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const status = getPromotionStatus(p);
                    
                    if (status === 'expired') {
                      return (
                        <>
                          <Button size="sm" onClick={() => renewPromotion(p.id)}>Renew (90d)</Button>
                          <Button size="sm" variant="outline" onClick={() => extendPromotion(p.id, 30)}>+30 Days</Button>
                          <Button size="sm" variant="outline" onClick={() => extendPromotion(p.id, 90)}>+90 Days</Button>
                          <Button size="sm" variant="outline" onClick={() => startDateEdit(p)}>Edit Dates</Button>
                        </>
                      );
                    }
                    
                    return (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startDateEdit(p)}>Edit Dates</Button>
                        <Button size="sm" variant="outline" onClick={() => updatePromotion(p.id, { is_active: !p.is_active })}>
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updatePromotion(p.id, { stackable: !p.stackable })}>
                          {p.stackable ? 'Unstack' : 'Make Stackable'}
                        </Button>
                      </>
                    );
                  })()}
                  <Button size="sm" variant="destructive" onClick={() => deletePromotion(p.id)}>Delete</Button>
                </div>
              </div>

              {/* Promo Details / Terms */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Eligibility (one per line)</Label>
                  <textarea
                    className="w-full border rounded p-2 min-h-[120px] bg-background"
                    placeholder="25HP and up\nTrade required\n2004 or older"
                    value={Array.isArray((p as any).details?.eligibility) ? (p as any).details.eligibility.join('\n') : ''}
                    onChange={(e) => updatePromotion(p.id, { details: { ...(p as any).details, eligibility: e.target.value.split('\n').map(s => s.replace(/^[-•\s]+/, '').trim()).filter(Boolean) } as any })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms (one per line)</Label>
                  <textarea
                    className="w-full border rounded p-2 min-h-[120px] bg-background"
                    placeholder="Cannot combine with other offers\nDealer installation required"
                    value={Array.isArray((p as any).details?.terms) ? (p as any).details.terms.join('\n') : ''}
                    onChange={(e) => updatePromotion(p.id, { details: { ...(p as any).details, terms: e.target.value.split('\n').map(s => s.replace(/^[-•\s]+/, '').trim()).filter(Boolean) } as any })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Processing Time</Label>
                  <Input value={(p as any).details?.processingTime ?? ''} onChange={(e) => updatePromotion(p.id, { details: { ...(p as any).details, processingTime: e.target.value } as any })} placeholder="30 days" />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Note</Label>
                  <Input value={(p as any).details?.expiryNote ?? ''} onChange={(e) => updatePromotion(p.id, { details: { ...(p as any).details, expiryNote: e.target.value } as any })} placeholder="Limited time offer" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Fine Print</Label>
                  <Input value={(p as any).details?.finePrint ?? ''} onChange={(e) => updatePromotion(p.id, { details: { ...(p as any).details, finePrint: e.target.value } as any })} placeholder="See dealer for complete details and eligibility" />
                </div>
              </div>

              {/* Rules */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Rules</h4>
                {(rulesByPromo[p.id] || []).length === 0 ? (
                  <div className="flex items-center justify-between rounded border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">No rules yet — this promotion won't apply to anything.</p>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const { error } = await supabase.from('promotions_rules').insert({
                        promotion_id: p.id,
                        rule_type: 'all',
                        model: null,
                        motor_type: null,
                        horsepower_min: null,
                        horsepower_max: null,
                        // Defaults; rule inherits promo discount
                        discount_percentage: 0,
                        discount_fixed_amount: 0,
                      });
                      if (error) {
                        toast({ title: 'Error', description: 'Failed to add rule', variant: 'destructive' });
                      } else {
                        toast({ title: 'Rule added', description: 'Applied to all motors' });
                        await loadAll();
                      }
                    }}>Quick add: All Motors</Button>
                  </div>
                ) : (
                  (rulesByPromo[p.id] || []).map((r) => (
                    <div key={r.id} className="flex items-center justify-between border border-border rounded p-2">
                      <div className="text-sm">
                        <span className="font-medium">{r.rule_type}</span>
                        {r.rule_type === 'model' && r.model && <span className="ml-2">• {r.model}</span>}
                        {r.rule_type === 'motor_type' && r.motor_type && <span className="ml-2">• {r.motor_type}</span>}
                        {r.rule_type === 'horsepower_range' && <span className="ml-2">• {r.horsepower_min ?? 0} - {r.horsepower_max ?? '∞'} HP</span>}
                        {/* NEW: show override details */}
                        {Number(r.discount_fixed_amount) > 0 ? (
                          <span className="ml-2">• ${Number(r.discount_fixed_amount).toLocaleString()} off</span>
                        ) : Number(r.discount_percentage) > 0 ? (
                          <span className="ml-2">• {Number(r.discount_percentage)}% off</span>
                        ) : (
                          <span className="ml-2 text-muted-foreground">• Inherits promo discount</span>
                        )}
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

                    {/* NEW: Rule-level discount override controls */}
                    <div className="space-y-2">
                      <Label>Rule Discount</Label>
                      <Select value={ruleDiscountType} onValueChange={(v) => setRuleDiscountType(v as 'inherit' | 'percentage' | 'fixed')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Inherit promo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Inherit promo discount</SelectItem>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {ruleDiscountType !== 'inherit' && (
                      <div className="space-y-2">
                        <Label>{ruleDiscountType === 'percentage' ? 'Discount %' : 'Discount $'}</Label>
                        <Input
                          type="number"
                          value={ruleDiscountValue || ''}
                          onChange={(e) => setRuleDiscountValue(Number(e.target.value || 0))}
                        />
                      </div>
                    )}

                    <div className="flex items-end">
                      <Button onClick={() => createRule(p.id)}>Add Rule</Button>
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
