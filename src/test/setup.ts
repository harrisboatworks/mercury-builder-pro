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

  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  (window as unknown as { ResizeObserver: typeof ResizeObserverPolyfill }).ResizeObserver =
    (window as unknown as { ResizeObserver?: typeof ResizeObserverPolyfill }).ResizeObserver ||
    ResizeObserverPolyfill;

  const elementPrototype = window.Element.prototype;

  if (typeof elementPrototype.hasPointerCapture !== "function") {
    elementPrototype.hasPointerCapture = () => false;
  }
  if (typeof elementPrototype.setPointerCapture !== "function") {
    elementPrototype.setPointerCapture = () => {};
  }
  if (typeof elementPrototype.releasePointerCapture !== "function") {
    elementPrototype.releasePointerCapture = () => {};
  }
  if (typeof elementPrototype.scrollIntoView !== "function") {
    elementPrototype.scrollIntoView = () => {};
  }

  if (typeof window.PointerEvent !== "function") {
    class PointerEventPolyfill extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      readonly isPrimary: boolean;

      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? "mouse";
        this.isPrimary = init.isPrimary ?? true;
      }
    }

    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      writable: true,
      value: PointerEventPolyfill,
    });
  }
}
