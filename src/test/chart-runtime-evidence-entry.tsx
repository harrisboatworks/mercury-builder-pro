import { createRoot } from "react-dom/client";

import { ChartRuntimeHarness } from "@/test/chart-runtime-harness";

import "@/index.css";

function ChartRuntimeEvidencePage() {
  return (
    <main
      data-testid="chart-runtime-evidence-page"
      style={{ padding: 24, background: "#ffffff", color: "#111827", fontFamily: "sans-serif" }}
    >
      <h1>Chart wrapper runtime evidence</h1>
      <p>
        Isolated Recharts 3 harness for `ChartContainer`, `ChartLegendContent`, and
        `ChartTooltipContent`. This page is not a production route.
      </p>
      <section data-testid="chart-runtime-evidence-wide">
        <h2>640×360 with defaultIndex tooltip</h2>
        <ChartRuntimeHarness width={640} height={360} />
      </section>
      <section data-testid="chart-runtime-evidence-narrow">
        <h2>360×240 responsive box</h2>
        <ChartRuntimeHarness width={360} height={240} />
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("chart runtime evidence root is missing");
}

createRoot(root).render(<ChartRuntimeEvidencePage />);
