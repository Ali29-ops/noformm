export function formatMoney(amount: number, currency = "EGP", locale = "en") {
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
