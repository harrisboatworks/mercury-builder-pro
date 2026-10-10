export const money = (n: number | string) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })
    .format(typeof n === "string" ? Number(n) : n);

export const moneyWithCents = (n: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
