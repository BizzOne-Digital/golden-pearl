/** Ontario-style HST shown at checkout (13%). */
export const TAX_RATE = 0.13;

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function taxFromSubtotal(subtotal: number) {
  return roundMoney(subtotal * TAX_RATE);
}

export function totalFromSubtotal(subtotal: number) {
  return roundMoney(subtotal + taxFromSubtotal(subtotal));
}
