
# Make Chat & Voice Inventory Accurate and Efficient

## Current Problems Identified

| Issue | Impact | Location |
|-------|--------|----------|
| **Chatbot fetches ALL motors** without `in_stock` filter | Tells customers about motors that aren't in stock | `ai-chatbot-stream/index.ts:107-114` |
| **Chatbot's HP-specific lookup** ignores stock status | Shows out-of-stock options when asked "do you have 20HP?" | `ai-chatbot-stream/index.ts:134-142` |
| **VisibleMotorsStore missing `stock_quantity`** | Voice agent can't accurately report how many units are available | `src/lib/visibleMotorsStore.ts:9-18` |
| **Voice's check_inventory** lacks stock quantity | Only returns boolean `in_stock`, not quantity | `elevenlabs-mcp-server/index.ts:787-832` |
| **No "In Stock First" sort order** | In-stock motors don't appear first in voice/chat responses | Multiple locations |

---

## Solution: 3-Part Fix

### Part 1: Add Stock-Aware Inventory Function to Chatbot

Create a new function that fetches ONLY in-stock motors, and use it for inventory questions.

**File: `supabase/functions/ai-chatbot-stream/index.ts`**

Add new function:
```typescript
// Get only IN-STOCK motors with quantity
async function getInStockMotors() {
  const { data: motors } = await supabase
    .from('motor_models')
    .select('id, model, model_display, horsepower, msrp, sale_price, family, shaft, control, stock_quantity')
    .eq('in_stock', true)
    .order('horsepower', { ascending: true });
  return motors || [];
}
```

Update `getMotorsForHP` to include stock status:
```typescript
async function getMotorsForHP(hp: number) {
  const { data: motors } = await supabase
    .from('motor_models')
    .select('id, model_display, horsepower, msrp, sale_price, family, shaft, control, in_stock, stock_quantity')
    .eq('horsepower', hp)
    .order('in_stock', { ascending: false })  // In-stock first!
    .order('msrp', { ascending: true });
  return motors || [];
}
```

Update `buildGroupedInventorySummary` to show stock status:
```typescript
function buildGroupedInventorySummary(motors: any[]): string {
  // Group only in-stock motors by HP
  const inStockMotors = motors.filter(m => m.in_stock);
  const byHP: Record<number, any[]> = {};
  inStockMotors.forEach(m => {
    const hp = m.horsepower;
    if (!byHP[hp]) byHP[hp] = [];
    byHP[hp].push(m);
  });
  
  return Object.entries(byHP)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .map(([hp, models]) => {
      const totalQty = models.reduce((sum, m) => sum + (m.stock_quantity || 1), 0);
      const prices = models.map(m => m.sale_price || m.msrp || 0).filter(p => p > 0);
      const priceStr = prices.length ? `$${Math.min(...prices).toLocaleString()}` : 'TBD';
      return `${hp}HP: ${priceStr} [${totalQty} in stock]`;
    })
    .join(' | ');
}
```

---

### Part 2: Add `stock_quantity` to Voice Agent's Visible Motors

**File: `src/lib/visibleMotorsStore.ts`**

Update interface to include stock_quantity:
```typescript
export interface VisibleMotor {
  id: string;
  model: string;
  model_display?: string;
  horsepower: number;
  price: number;
  msrp?: number;
  in_stock?: boolean;
  stock_quantity?: number;  // NEW
  type?: string;
}
```

Update `formatMotorsForVoice` to include quantity:
```typescript
top_motors: summary.motors.slice(0, limit).map(m => ({
  model: m.model_display || m.model,
  hp: m.horsepower,
  price: m.price,
  in_stock: m.in_stock,
  quantity: (m as any).stock_quantity || (m.in_stock ? 1 : 0),  // Include quantity
})),
```

**File: `src/pages/quote/MotorSelectionPage.tsx`**

Pass stock_quantity to the store:
```typescript
const visibleMotors: VisibleMotor[] = finalFilteredMotors.map(m => ({
  id: m.id,
  model: m.model_number || m.model,
  model_display: m.model,
  horsepower: m.hp,
  price: m.price,
  msrp: m.msrp,
  in_stock: m.in_stock,
  stock_quantity: m.stock_quantity,  // NEW
  type: m.type,
}));
```

---

### Part 3: Enhance Voice Agent's `check_inventory` Tool

**File: `supabase/functions/elevenlabs-mcp-server/index.ts`**

Update the check_inventory case to include quantities and prioritize in-stock:
```typescript
case "check_inventory": {
  const inStockOnly = args.in_stock_only !== false;
  let query = supabase
    .from("motor_models")
    .select("model_display, model, horsepower, msrp, family, in_stock, stock_quantity, shaft, control_type")
    .order("in_stock", { ascending: false })  // In-stock first!
    .order("horsepower");
  
  // ... existing filters ...
  
  const motorList = motors.map(m => {
    const name = m.model_display || `${m.family} ${m.horsepower}HP`;
    const price = m.msrp ? `$${m.msrp.toLocaleString()}` : "Call for price";
    const qty = m.stock_quantity || 0;
    const stock = m.in_stock 
      ? `✓ ${qty} in stock` 
      : "Available to order";
    return `• ${name}: ${price} (${stock})`;
  }).join("\n");
  
  const totalInStock = motors
    .filter(m => m.in_stock)
    .reduce((sum, m) => sum + (m.stock_quantity || 1), 0);
  
  return { 
    content: [{ 
      type: "text", 
      text: `Found ${motors.length} motors...\n\n${motorList}\n\n${totalInStock} units in stock and ready.` 
    }] 
  };
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `ai-chatbot-stream/index.ts` | Add `in_stock` filter, include `stock_quantity`, sort in-stock first |
| `visibleMotorsStore.ts` | Add `stock_quantity` to interface and output |
| `MotorSelectionPage.tsx` | Pass `stock_quantity` to visible motors store |
| `elevenlabs-mcp-server/index.ts` | Include `stock_quantity`, show actual counts, sort in-stock first |

## Expected Outcome

- **Chatbot** will only mention motors that are actually in stock
- **Voice agent** will accurately say "we have 3 of those in stock" instead of just "in stock"
- Both systems will show in-stock options first
- No more phantom inventory confusion

## Deployment

After changes:
1. Redeploy `ai-chatbot-stream` edge function
2. Redeploy `elevenlabs-mcp-server` edge function
3. Frontend changes deploy automatically
