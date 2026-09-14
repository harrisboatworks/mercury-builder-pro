import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const rechartsVersion = require("recharts/package.json").version;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist-chart-evidence");
const artifactDir = process.env.CHART_EVIDENCE_DIR || "/opt/cursor/artifacts";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".map")) return "application/json";
  return "application/octet-stream";
}

async function serveEvidence() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let relative = decodeURIComponent(url.pathname);
    if (relative === "/") {
      relative = "/src/test/chart-runtime-evidence.html";
    }
    const filePath = path.join(outDir, relative);
    if (!filePath.startsWith(outDir)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    try {
      const body = readFileSync(filePath);
      res.writeHead(200, { "content-type": contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { server, port };
}

async function measureSection(page, testId) {
  return page.locator(`[data-testid="${testId}"]`).evaluate((section) => {
    const harness = section.querySelector("[data-testid='chart-runtime-harness']");
    const surface = section.querySelector(".recharts-surface");
    const wrapper = section.querySelector(".recharts-responsive-container");
    const tooltip = section.querySelector(".recharts-tooltip-wrapper");
    const labels = [...section.querySelectorAll("div")]
      .filter((node) =>
        ["Desktop visits", "Mobile visits", "January"].includes(node.textContent?.trim() || ""),
      )
      .map((node) => node.textContent?.trim());
    const desktopIcon = section.querySelector("svg.lucide-monitor");
    const mobileSwatch = [...section.querySelectorAll("div.h-2.w-2")].find((node) =>
      node.parentElement?.textContent?.includes("Mobile visits"),
    );
    const tooltipText = tooltip?.textContent || "";
    const chartStyle = section.querySelector("style")?.textContent || "";

    return {
      harness: harness
        ? {
            width: harness.getBoundingClientRect().width,
            height: harness.getBoundingClientRect().height,
          }
        : null,
      surface: surface
        ? {
            width: Number(surface.getAttribute("width")),
            height: Number(surface.getAttribute("height")),
          }
        : null,
      wrapper: wrapper
        ? {
            width: wrapper.getBoundingClientRect().width,
            height: wrapper.getBoundingClientRect().height,
          }
        : null,
      tooltipVisible: Boolean(tooltip && getComputedStyle(tooltip).visibility !== "hidden"),
      tooltipText,
      legendLabels: [...new Set(labels.filter((label) => label !== "January"))],
      hasJanuaryTooltip: tooltipText.includes("January"),
      hasDesktopValue: tooltipText.includes("186"),
      hasMobileValue: tooltipText.includes("80"),
      hasDesktopIcon: Boolean(desktopIcon),
      mobileSwatchBackground: mobileSwatch ? getComputedStyle(mobileSwatch).backgroundColor : null,
      chartStyleHasDesktop: chartStyle.includes("--color-desktop: hsl(221, 83%, 40%)"),
      chartStyleHasMobile: chartStyle.includes("--color-mobile: hsl(173, 80%, 36%)"),
    };
  });
}

await run("npx", ["vite", "build", "--config", "vite.chart-evidence.config.ts"]);

const { server, port } = await serveEvidence();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/opt/google/chrome/chrome",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid='chart-runtime-evidence-page']");
  await page.waitForSelector(".recharts-surface");
  await page.waitForTimeout(500);

  mkdirSync(artifactDir, { recursive: true });

  const widePath = path.join(artifactDir, "chart_runtime_evidence_640x360.png");
  const narrowPath = path.join(artifactDir, "chart_runtime_evidence_360x240.png");
  const pagePath = path.join(artifactDir, "chart_runtime_evidence_page.png");

  await page.locator("[data-testid='chart-runtime-evidence-wide']").screenshot({ path: widePath });
  await page.locator("[data-testid='chart-runtime-evidence-narrow']").screenshot({ path: narrowPath });
  await page.screenshot({ path: pagePath, fullPage: true });

  const measurements = {
    runtime: "playwright-chromium",
    recharts: rechartsVersion,
    page: `http://127.0.0.1:${port}/`,
    wide: await measureSection(page, "chart-runtime-evidence-wide"),
    narrow: await measureSection(page, "chart-runtime-evidence-narrow"),
    screenshots: { widePath, narrowPath, pagePath },
  };

  writeFileSync(
    path.join(artifactDir, "chart_runtime_evidence.json"),
    `${JSON.stringify(measurements, null, 2)}\n`,
  );
  console.log(JSON.stringify(measurements, null, 2));
} finally {
  await browser.close();
  server.close();
}
