// Entrada em centavos, sem conversao para ponto flutuante ou truncamento de digitos.
export function readPriceDigits(value: string): string | null {
  const text = value.trim().replace(/^R\$\s*/i, "");
  if (!/^[\d.,\s]*$/.test(text)) return null;
  return text.replace(/\D/g, "").replace(/^0+/, "") || "0";
}

export function formatPriceInput(digits: string): string {
  const padded = digits.padStart(4, "0");
  return `${padded.slice(0, -2)},${padded.slice(-2)}`;
}

export function priceDigitsToApi(digits: string): string {
  const padded = digits.padStart(3, "0");
  return `${padded.slice(0, -2)}.${padded.slice(-2)}`;
}
