export const money = (n: number | string) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })
    .format(typeof n === "string" ? Number(n) : n);