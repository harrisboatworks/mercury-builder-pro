
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const financingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.coerce.number().nonnegative("Rate must be >= 0"),
  term_months: z.coerce.number().int().positive("Term must be > 0"),
  min_amount: z.coerce.number().nonnegative("Minimum amount must be >= 0"),
  is_promo: z.boolean().default(false),
  promo_text: z.string().nullable().optional(),
  promo_end_date: z.string().nullable().optional(), // 'YYYY-MM-DD' or null
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().nonnegative().default(0),
});

export type FinancingFormValues = z.infer<typeof financingSchema>;

type FinancingFormProps = {
  defaultValues?: Partial<FinancingFormValues>;
  onSubmit: (values: FinancingFormValues) => void;
  submitLabel?: string;
};

export default function FinancingForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
}: FinancingFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FinancingFormValues>({
    resolver: zodResolver(financingSchema),
    defaultValues: {
      name: "",
      rate: 7.99,
      term_months: 60,
      min_amount: 5000,
      is_promo: false,
      promo_text: "",
      promo_end_date: "",
      is_active: true,
      display_order: 0,
      ...defaultValues,
    },
  });

  const isPromo = watch("is_promo");

  useEffect(() => {
    // Normalize empty strings to null where appropriate
    const sub = watch((values, { name }) => {
      if (name === "promo_text" && !values.promo_text) {
        setValue("promo_text", "" as any);
      }
      if (name === "promo_end_date" && !values.promo_end_date) {
        setValue("promo_end_date", "" as any);
      }
    });
    return () => sub.unsubscribe();
  }, [watch, setValue]);

  return (
    <form
      onSubmit={handleSubmit((vals) => {
        const cleaned: FinancingFormValues = {
          ...vals,
          promo_text: vals.is_promo ? (vals.promo_text || null) : null,
          promo_end_date: vals.is_promo ? (vals.promo_end_date || null) : null,
        };
        onSubmit(cleaned);
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="display_order">Display Order</Label>
          <Input id="display_order" type="number" inputMode="numeric" {...register("display_order")} />
          {errors.display_order && <p className="text-destructive text-sm mt-1">{errors.display_order.message}</p>}
        </div>

        <div>
          <Label htmlFor="rate">Rate (%)</Label>
          <Input id="rate" type="number" step="0.01" inputMode="decimal" {...register("rate")} />
          {errors.rate && <p className="text-destructive text-sm mt-1">{errors.rate.message}</p>}
        </div>

        <div>
          <Label htmlFor="term_months">Term (months)</Label>
          <Input id="term_months" type="number" inputMode="numeric" {...register("term_months")} />
          {errors.term_months && <p className="text-destructive text-sm mt-1">{errors.term_months.message}</p>}
        </div>

        <div>
          <Label htmlFor="min_amount">Minimum Amount ($)</Label>
          <Input id="min_amount" type="number" inputMode="decimal" step="0.01" {...register("min_amount")} />
          {errors.min_amount && <p className="text-destructive text-sm mt-1">{errors.min_amount.message}</p>}
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Switch id="is_active" {...register("is_active")} />
          <Label htmlFor="is_active">Active</Label>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Switch id="is_promo" {...register("is_promo")} />
          <Label htmlFor="is_promo">Promo</Label>
        </div>

        {isPromo && (
          <>
            <div className="md:col-span-2">
              <Label htmlFor="promo_text">Promo Text</Label>
              <Input id="promo_text" placeholder="e.g., Special financing until Aug 31!" {...register("promo_text")} />
            </div>

            <div>
              <Label htmlFor="promo_end_date">Promo End Date</Label>
              <Input id="promo_end_date" type="date" {...register("promo_end_date")} />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
