import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CHART_RUNTIME_HARNESS_CONFIG,
  CHART_RUNTIME_HARNESS_HEIGHT,
  CHART_RUNTIME_HARNESS_WIDTH,
  ChartRuntimeHarness,
} from "@/test/chart-runtime-harness";

let measuredBox = {
  width: CHART_RUNTIME_HARNESS_WIDTH,
  height: CHART_RUNTIME_HARNESS_HEIGHT,
};

type ObservedResize = {
  callback: ResizeObserverCallback;
  target: Element | null;
};

const resizeObservers: ObservedResize[] = [];

function resizeObserverEntry(target: Element): ResizeObserverEntry {
  const { width, height } = measuredBox;
  return {
    target,
    contentRect: {
      x: 0,
      y: 0,
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      toJSON() {
        return {};
      },
    },
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
    contentBoxSize: [{ inlineSize: width, blockSize: height }],
    devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
  };
}

function notifyObservedResize() {
  for (const observer of resizeObservers) {
    if (!observer.target) continue;
    observer.callback([resizeObserverEntry(observer.target)], observer as unknown as ResizeObserver);
  }
}

function installChartMeasureStubs() {
  resizeObservers.length = 0;

  class NotifyingResizeObserver implements ResizeObserver {
    private readonly observed: ObservedResize;

    constructor(callback: ResizeObserverCallback) {
      this.observed = { callback, target: null };
      resizeObservers.push(this.observed);
    }

    observe(target: Element) {
      this.observed.target = target;
      this.observed.callback([resizeObserverEntry(target)], this);
    }

    unobserve() {
      this.observed.target = null;
    }

    disconnect() {
      this.observed.target = null;
    }
  }

  window.ResizeObserver = NotifyingResizeObserver;

  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: measuredBox.height,
      right: measuredBox.width,
      width: measuredBox.width,
      height: measuredBox.height,
      toJSON() {
        return {};
      },
    } as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => measuredBox.width);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => measuredBox.height);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => measuredBox.width);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => measuredBox.height);
}

beforeEach(() => {
  measuredBox = {
    width: CHART_RUNTIME_HARNESS_WIDTH,
    height: CHART_RUNTIME_HARNESS_HEIGHT,
  };
  installChartMeasureStubs();
});

afterEach(() => {
  document.getElementById("recharts_measurement_span")?.remove();
  vi.restoreAllMocks();
});

describe("chart wrapper runtime (Recharts 3 harness)", () => {
  it("renders configured legend labels, the desktop icon, and a mobile color swatch", async () => {
    const { container } = render(<ChartRuntimeHarness />);

    await waitFor(() => {
      expect(screen.getAllByText("Desktop visits").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Mobile visits").length).toBeGreaterThan(0);
    });

    const legendDesktop = [...container.querySelectorAll("div")].find(
      (node) => node.textContent === "Desktop visits" && node.querySelector("svg.lucide-monitor"),
    );
    expect(legendDesktop).toBeTruthy();

    const legendMobile = [...container.querySelectorAll("div")].find(
      (node) => node.textContent === "Mobile visits" && node.querySelector("div.h-2.w-2"),
    );
    expect(legendMobile?.querySelector("div.h-2.w-2")).toHaveStyle({
      backgroundColor: "var(--color-mobile)",
    });

    const chartStyle = container.querySelector("style");
    expect(chartStyle?.textContent).toContain("--color-desktop: hsl(221, 83%, 40%)");
    expect(chartStyle?.textContent).toContain("--color-mobile: hsl(173, 80%, 36%)");
  });

  it("lets Recharts clone ChartLegendContent with payload (empty payload stays hidden)", () => {
    const { rerender } = render(
      <ChartContainer config={CHART_RUNTIME_HARNESS_CONFIG} id="legend-empty">
        <ChartLegendContent payload={[]} />
      </ChartContainer>,
    );
    expect(screen.queryByText("Desktop visits")).not.toBeInTheDocument();

    rerender(
      <ChartContainer config={CHART_RUNTIME_HARNESS_CONFIG} id="legend-payload">
        <ChartLegendContent
          payload={[
            { value: "desktop", dataKey: "desktop", color: "var(--color-desktop)" },
            { value: "mobile", dataKey: "mobile", color: "var(--color-mobile)" },
          ]}
        />
      </ChartContainer>,
    );

    expect(screen.getByText("Desktop visits")).toBeInTheDocument();
    expect(screen.getByText("Mobile visits")).toBeInTheDocument();
  });

  it("shows composed tooltip label and series values when Recharts injects the first index", async () => {
    const { container } = render(<ChartRuntimeHarness tooltipDefaultIndex={0} />);

    await waitFor(() => {
      const tooltip = container.querySelector(".recharts-tooltip-wrapper");
      expect(tooltip).toHaveTextContent("January");
      expect(tooltip).toHaveTextContent("Desktop visits");
      expect(tooltip).toHaveTextContent("Mobile visits");
      expect(tooltip).toHaveTextContent("186");
      expect(tooltip).toHaveTextContent("80");
    });
  });

  it("sizes the Recharts surface from the harness box after measure", async () => {
    const { rerender, container } = render(<ChartRuntimeHarness width={640} height={360} />);

    await waitFor(() => {
      const surface = container.querySelector(".recharts-surface");
      expect(surface).toHaveAttribute("width", "640");
      expect(surface).toHaveAttribute("height", "360");
    });

    measuredBox = { width: 360, height: 240 };
    rerender(<ChartRuntimeHarness width={360} height={240} />);
    notifyObservedResize();

    await waitFor(() => {
      const surface = container.querySelector(".recharts-surface");
      expect(surface).toHaveAttribute("width", "360");
      expect(surface).toHaveAttribute("height", "240");
    });
  });

  it("renders tooltip content from a Recharts-shaped payload without a live chart", () => {
    const { container } = render(
      <ChartContainer config={CHART_RUNTIME_HARNESS_CONFIG} id="tooltip-payload">
        <ChartTooltipContent
          active
          label="January"
          payload={[
            {
              dataKey: "desktop",
              name: "desktop",
              value: 186,
              color: "var(--color-desktop)",
              payload: { month: "January", desktop: 186, mobile: 80 },
            },
            {
              dataKey: "mobile",
              name: "mobile",
              value: 80,
              color: "var(--color-mobile)",
              payload: { month: "January", desktop: 186, mobile: 80 },
            },
          ]}
        />
      </ChartContainer>,
    );

    const tooltip = container.querySelector("[data-chart='chart-tooltip-payload']");
    expect(tooltip).toHaveTextContent("January");
    expect(tooltip).toHaveTextContent("Desktop visits");
    expect(tooltip).toHaveTextContent("Mobile visits");
    expect(tooltip).toHaveTextContent("186");
    expect(tooltip).toHaveTextContent("80");
    expect(tooltip?.querySelector("svg.lucide-monitor")).toBeTruthy();
    expect(tooltip?.querySelector('[style*="--color-bg: var(--color-mobile)"]')).toBeTruthy();
  });
});
