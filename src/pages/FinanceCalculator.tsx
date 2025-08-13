import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatMotorTitle } from '@/lib/card-title';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';

interface DbMotor {
  id: string;
  model: string;
  year: number;
  base_price: number | null;
  sale_price: number | null;
}

const setSeo = (title: string, description: string) => {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);
  else {
    const m = document.createElement('meta');
    m.name = 'description';
    m.content = description;
    document.head.appendChild(m);
  }
  const canonicalHref = window.location.origin + '/finance-calculator';
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonicalHref;
};

export default function FinanceCalculator() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [motor, setMotor] = useState<DbMotor | null>(null);

  const modelId = params.get('model');

  const [price, setPrice] = useState<number>(0);
  const [down, setDown] = useState<number>(0);
  const [apr, setApr] = useState<number>(6.99);
  const [term, setTerm] = useState<number>(60);
  const { promo } = useActiveFinancingPromo();

  useEffect(() => {
    setSeo('Finance Calculator | Harris Boats', 'Estimate monthly payments for Mercury outboards.');
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!modelId) return;
      setLoading(true);
      const { data, error } = await supabase.from('motor_models').select('id, model, year, base_price, sale_price').eq('id', modelId).maybeSingle();
      if (!error && data) {
        setMotor(data as DbMotor);
        const p = (data.sale_price && data.sale_price > 0 ? data.sale_price : data.base_price) || 0;
        setPrice(Math.round(Number(p)));
      }
      setLoading(false);
    };
    run();
  }, [modelId]);

  useEffect(() => {
    if (promo?.rate) {
      setApr(Number(promo.rate));
    }
  }, [promo]);

  const monthly = useMemo(() => {
    const principal = Math.max(0, price - down);
    const r = apr / 100 / 12;
    const n = term;
    if (!principal || principal <= 0) return 0;
    if (r <= 0 || n <= 0) return Math.round(principal / Math.max(1, n));
    const m = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(m);
  }, [price, down, apr, term]);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Finance Calculator</h1>
        <p className="text-muted-foreground">Estimate your monthly payment. Values are estimates and not a credit offer.</p>
      </header>

      {motor && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{formatMotorTitle(motor.year, motor.model)}</CardTitle>
            <CardDescription>Prefilled from selected model</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} />
            </div>
            <div>
              <Label htmlFor="down">Down Payment</Label>
              <Input id="down" type="number" inputMode="numeric" value={down} onChange={(e) => setDown(Number(e.target.value || 0))} />
            </div>
            <div>
              <Label htmlFor="apr">APR (%)</Label>
              <Input id="apr" type="number" step="0.01" inputMode="decimal" value={apr} onChange={(e) => setApr(Number(e.target.value || 0))} />
            </div>
            <div>
              <Label htmlFor="term">Term (months)</Label>
              <Input id="term" type="number" inputMode="numeric" value={term} onChange={(e) => setTerm(Number(e.target.value || 0))} />
            </div>
          </div>

          {promo && (
            <div className="mt-4 text-sm text-foreground">
              <span className="font-medium">Promo APR applied:</span> {promo.rate}%{' '}
              {promo.promo_text ? (<><span>— {promo.promo_text}</span></>) : null}{' '}
              {promo.promo_end_date ? (<><span>(ends {new Date(promo.promo_end_date).toLocaleDateString()})</span></>) : null}
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <div className="text-muted-foreground">Estimated Monthly:</div>
            <div className="text-3xl font-bold">${monthly.toLocaleString()}</div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link to="/">Back to Motors</Link>
            </Button>
            {motor && (
              <Button variant="outline" asChild>
                <a href={`/?select=${encodeURIComponent(modelId || '')}`}>Use this motor</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
