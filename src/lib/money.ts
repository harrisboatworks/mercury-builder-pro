export const money = (n: number | string) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(typeof n === "string" ? Number(n) : n);