import "@testing-library/jest-dom";

if (typeof window !== "undefined") {
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// ResizeObserver polyfill (used by Radix Slider)
class ResizeObserverPolyfill {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(window as unknown as { ResizeObserver: typeof ResizeObserverPolyfill }).ResizeObserver =
  (window as unknown as { ResizeObserver?: typeof ResizeObserverPolyfill }).ResizeObserver ||
  ResizeObserverPolyfill;
}


