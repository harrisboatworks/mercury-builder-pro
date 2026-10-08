import { Monitor } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Isolated chart-wrapper harness. Not a production route and not imported by App.
 * Used by unit tests and the local evidence page only.
 */
export const CHART_RUNTIME_HARNESS_DATA = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
] as const;

export const CHART_RUNTIME_HARNESS_CONFIG = {
  desktop: {
    label: "Desktop visits",
    color: "hsl(221, 83%, 40%)",
    icon: Monitor,
  },
  mobile: {
    label: "Mobile visits",
    color: "hsl(173, 80%, 36%)",
  },
} satisfies ChartConfig;

export const CHART_RUNTIME_HARNESS_WIDTH = 640;
export const CHART_RUNTIME_HARNESS_HEIGHT = 360;

type ChartRuntimeHarnessProps = {
  width?: number;
  height?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  tooltipDefaultIndex?: number;
};

export function ChartRuntimeHarness({
  width = CHART_RUNTIME_HARNESS_WIDTH,
  height = CHART_RUNTIME_HARNESS_HEIGHT,
  showTooltip = true,
  showLegend = true,
  tooltipDefaultIndex = 0,
}: ChartRuntimeHarnessProps) {
  return (
    <div
      data-testid="chart-runtime-harness"
      data-harness-width={width}
      data-harness-height={height}
      style={{ width, height }}
    >
      <ChartContainer
        id="runtime-harness"
        config={CHART_RUNTIME_HARNESS_CONFIG}
        className="aspect-auto h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <BarChart
          accessibilityLayer
          data={[...CHART_RUNTIME_HARNESS_DATA]}
          margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={40} />
          {showTooltip ? (
            <ChartTooltip
              defaultIndex={tooltipDefaultIndex}
              content={<ChartTooltipContent />}
              cursor={false}
            />
          ) : null}
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
