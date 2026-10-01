import { parseLightspeedJson } from "./lightspeed-json.ts";
function assert(value: unknown) { if (!value) throw new Error("Assertion failed"); }
Deno.test("64-bit IDs retain every digit while ordinary integers remain numeric", () => {
  const r = parseLightspeedJson('{"Servicewriterid":765432109876543210,"technicianid":-9007199254740993,"ROHeaderID":123,"safe":9007199254740991}');
  assert(r.Servicewriterid === "765432109876543210");
  assert(r.technicianid === "-9007199254740993");
  assert(r.ROHeaderID === 123 && r.safe === Number.MAX_SAFE_INTEGER);
});
Deno.test("quoted digits and escapes are preserved", () => {
  const r = parseLightspeedJson('{"note":"ID 765432109876543210; \\"9007199254740993\\"","key9007199254740993":"9007199254740993"}');
  assert(r.note === 'ID 765432109876543210; "9007199254740993"');
  assert(r.key9007199254740993 === "9007199254740993");
});
Deno.test("decimal amounts, exponents, arrays and null keep JSON semantics", () => {
  const text = '{"amount":0.1234567890123456789,"exponent":1e20,"nested":[12.50,null,true,{"id":9007199254740993}]}';
  const r = parseLightspeedJson(text), ordinary = JSON.parse(text);
  assert(r.amount === ordinary.amount && r.exponent === ordinary.exponent);
  assert(r.nested[0] === 12.5 && r.nested[1] === null && r.nested[2] === true);
  assert(r.nested[3].id === "9007199254740993");
});
Deno.test("malformed source does not disclose a private payload in errors", () => {
  try { parseLightspeedJson('{"private":"fixture-private"'); } catch (e) {
    assert(e instanceof Error && e.message === "Invalid Lightspeed JSON"); return;
  }
  throw new Error("Expected invalid JSON rejection");
});
