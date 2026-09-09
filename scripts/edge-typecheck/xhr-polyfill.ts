/**
 * Typecheck-only stand-in for `deno.land/x/xhr@0.1.0`.
 *
 * Callers use a side-effect import to polyfill XMLHttpRequest at runtime.
 * Typecheck does not execute that polyfill; an empty module is enough and
 * stays honest: a named import from this specifier would fail here.
 */
export {};
