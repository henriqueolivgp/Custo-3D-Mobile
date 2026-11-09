/** Formata no estilo pt-PT (vírgula decimal, espaço nos milhares) sem depender de Intl. */
export function formatNumber(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '0';
  const fixed = Math.abs(n).toFixed(decimals);
  const negative = n < 0 && Number(fixed) !== 0;
  const [int = '0', dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return (negative ? '-' : '') + grouped + (dec ? ',' + dec : '');
}

export function formatMoney(n: number, decimals = 2): string {
  return formatNumber(n, decimals) + '\u00A0€';
}

export function formatDuration(totalMinutes: number): string {
  const total = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Aceita "12,5" e "12.5". Devolve null se não for um número válido. */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d*\.?\d*$/.test(t) || !/\d/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Limpa o texto de um campo decimal: só dígitos e um separador. */
export function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.,]/g, '');
  const firstSep = cleaned.search(/[.,]/);
  if (firstSep === -1) return cleaned;
  return cleaned.slice(0, firstSep + 1) + cleaned.slice(firstSep + 1).replace(/[.,]/g, '');
}

/** Número → texto para um campo de edição (sem milhares, vírgula decimal). */
export function toInputText(n: number, maxDecimals = 3): string {
  return String(Number(n.toFixed(maxDecimals))).replace('.', ',');
}
