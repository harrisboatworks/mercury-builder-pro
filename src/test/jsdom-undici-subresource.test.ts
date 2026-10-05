/**
 * @vitest-environment node
 */
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const PROOF = "SYNTHETIC-JSDOM-30";
// Port 9 is on the Fetch bad-port list, so jsdom rejects it before the base
// dispatcher runs. 39999 is closed on this host and is outside that list.
const ORIGIN = "http://127.0.0.1:39999";

function resolvedUndici(packageName: string) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const undiciEntry = require.resolve("undici", {
    paths: [dirname(packageJsonPath)],
  });
  const undici = require(undiciEntry) as {
    getGlobalDispatcher: () => object;
  };
  const undiciJsonPath = require.resolve("undici/package.json", {
    paths: [dirname(packageJsonPath)],
  });
  return {
    version: require(undiciJsonPath).version as string,
    dispatcher: undici.getGlobalDispatcher(),
  };
}

type DispatchHandler = {
  onConnect?: unknown;
  onRequestStart?: (controller: { rawHeaders?: unknown }, context: unknown) => void;
  onResponseStart?: (
    controller: unknown,
    statusCode: number,
    headers: Record<string, string>,
    statusText: string,
  ) => void;
  onResponseData?: (controller: unknown, chunk: Buffer) => void;
  onResponseEnd?: (controller: unknown, trailers: unknown) => void;
};

class RecordingDispatcher {
  readonly calls: Array<{
    origin?: string;
    path?: string;
    method?: string;
    sawOnRequestStart: boolean;
    sawRawHeaders: boolean;
    sawLegacyOnConnect: boolean;
  }> = [];

  closed = false;
  destroyed = false;
  close() {}
  destroy() {}

  dispatch(
    options: { origin?: string; path?: string; method?: string },
    handler: DispatchHandler,
  ) {
    const controller = {
      rawHeaders: [] as string[],
      rawTrailers: [] as string[],
      pause() {},
      resume() {},
      abort() {},
    };
    let sawRawHeaders = false;
    const start = handler.onRequestStart?.bind(handler);
    if (start) {
      handler.onRequestStart = (incoming, context) => {
        sawRawHeaders = incoming != null && "rawHeaders" in incoming;
        return start(incoming, context);
      };
    }
    this.calls.push({
      origin: options.origin,
      path: options.path,
      method: options.method,
      sawOnRequestStart: typeof handler.onRequestStart === "function",
      sawRawHeaders: false,
      sawLegacyOnConnect: typeof handler.onConnect === "function",
    });
    handler.onRequestStart?.(controller, {});
    this.calls[this.calls.length - 1].sawRawHeaders = sawRawHeaders;
    handler.onResponseStart?.(controller, 200, { "content-type": "application/javascript" }, "OK");
    handler.onResponseData?.(controller, Buffer.from(`window.__subresourceProof = ${JSON.stringify(PROOF)};`));
    handler.onResponseEnd?.(controller, {});
    return true;
  }
}

describe("jsdom 30 scoped undici", () => {
  it("keeps jsdom on undici 8.10.2 and other consumers on 7.29.0", () => {
    const jsdomUndici = resolvedUndici("jsdom");
    const vercelUndici = resolvedUndici("@vercel/node");
    const rootUndici = require("undici") as { getGlobalDispatcher: () => object };

    expect(require("jsdom/package.json").version).toBe("30.1.1");
    expect(jsdomUndici.version).toBe("8.10.2");
    expect(jsdomUndici.dispatcher).toBe(globalThis[Symbol.for("undici.globalDispatcher.2")]);
    expect(vercelUndici.version).toBe("7.29.0");
    expect(require("undici/package.json").version).toBe("7.29.0");
    expect(rootUndici.getGlobalDispatcher()).toBe(globalThis[Symbol.for("undici.globalDispatcher.1")]);
    expect(vercelUndici.dispatcher).toBe(rootUndici.getGlobalDispatcher());
    expect(require("pako/package.json").version).toBe("3.0.2");
  });

  it("runs an offline script subresource through the undici 8 handler", async () => {
    const dispatcher = new RecordingDispatcher();
    const dom = new JSDOM(`<!doctype html><script src="${ORIGIN}/proof.js"></script>`, {
      url: `${ORIGIN}/page`,
      runScripts: "dangerously",
      resources: { dispatcher },
    });

    const deadline = Date.now() + 2000;
    while (dom.window.__subresourceProof !== PROOF) {
      if (Date.now() > deadline) {
        throw new Error(`script subresource did not run; calls=${JSON.stringify(dispatcher.calls)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(dispatcher.calls).toEqual([
      {
        origin: ORIGIN,
        path: "/proof.js",
        method: "GET",
        sawOnRequestStart: true,
        sawRawHeaders: true,
        sawLegacyOnConnect: false,
      },
    ]);
    dom.window.close();
  });
});
