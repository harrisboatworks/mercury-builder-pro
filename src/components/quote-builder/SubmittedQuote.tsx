import { Card } from '@/components/ui/card';

const cad = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

/** A submitted quote is a receipt, not input to today's pricing calculator. */
export default function SubmittedQuote({ quote }: { quote: any }) {
  const p = quote.pricing || {};
  const money = (label: string, value: unknown) => typeof value === 'number' && Number.isFinite(value)
    ? <div className="flex justify-between gap-4" key={label}><span>{label}</span><span>{cad(value)}</span></div> : null;
  const rounding = typeof p.totalPrice === 'number' && typeof p.subtotal === 'number' && typeof p.hst === 'number'
    ? p.totalPrice - Math.round((p.subtotal + p.hst) * 100) / 100 : 0;
  return <Card className="p-6 space-y-5 md:col-span-2">
    <div><h2 className="text-xl font-semibold">Submitted quote {quote.quoteNumber}</h2>
      <p className="text-muted-foreground">{quote.customer?.name}</p>
      {quote.validUntil && <p className="text-sm">Valid until {new Date(quote.validUntil).toLocaleDateString('en-CA')}</p>}
    </div>
    <div><h3 className="font-semibold">{quote.motor?.model}</h3>
      <p>{[quote.motor?.hp && `${quote.motor.hp} HP`, quote.motor?.modelYear].filter(Boolean).join(' · ')}</p>
    </div>
    <div className="space-y-2">
      {money('Motor MSRP', p.msrp)}
      {p.discount > 0 && money('Dealer discount', -p.discount)}
      {money('Motor price', p.motorSubtotal)}
      {(quote.accessories || []).map((item: any, index: number) => <div key={index}>
        {money(item.name, item.price)}
        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      </div>)}
      {quote.tradeIn?.value > 0 && <div>
        {money('Trade-in credit', -quote.tradeIn.value)}
        <p className="text-sm text-muted-foreground">{[quote.tradeIn.year, quote.tradeIn.brand, quote.tradeIn.model].filter(Boolean).join(' ')}</p>
      </div>}
      <div className="border-t pt-3 space-y-2">
        {money('Subtotal', p.subtotal)}{money('HST (13%)', p.hst)}
        {Math.abs(rounding) >= 0.005 && money('Quote rounding', rounding)}
        <div className="text-lg font-bold">{money('Total cash price', p.totalPrice)}</div>
      </div>
    </div>
    {quote.financing && <div className="border-t pt-3 space-y-2">
      <h3 className="font-semibold">Financing quoted</h3>
      {money('Monthly payment', quote.financing.monthlyPayment)}
      {money('Amount financed', quote.financing.amountFinanced)}
      {money('Dealer administration fee', quote.financing.dealerFee)}
      <p>{quote.financing.rate}% APR · {quote.financing.amortizationMonths} months amortization · {quote.financing.contractTermMonths} months term</p>
      <p className="text-sm text-muted-foreground">On approved credit.</p>
    </div>}
    {quote.customerNotes && <p>{quote.customerNotes}</p>}
    <p className="text-sm text-muted-foreground">These are the prices recorded when this quote was submitted.</p>
  </Card>;
}
