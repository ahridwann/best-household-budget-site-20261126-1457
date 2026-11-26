// Household Ledger — number formatting helpers, one job: turn raw
// rupiah amounts into readable strings and back again.

// "Rp 6.002.224" — Indonesian grouping, no decimals.
export function formatIDR(amount) {
  const n = Math.round(Number(amount) || 0);
  return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Short form for chart labels: "Rp 6,0 jt" style, compact.
export function formatShort(amount) {
  const n = Math.round(Number(amount) || 0);
  if (n >= 1000000) {
    const v = n / 1000000;
    return 'Rp ' + (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')) + ' jt';
  }
  if (n >= 1000) return 'Rp ' + Math.round(n / 1000) + ' rb';
  return 'Rp ' + String(n);
}

// Percent with one decimal, e.g. 50.1%.
export function formatPct(part, whole) {
  if (!whole) return '0%';
  return ((part / whole) * 100).toFixed(1).replace('.', ',') + '%';
}

// Read a user-typed amount: strip dots, commas, spaces and "Rp".
export function parseAmount(text) {
  if (text === null || text === undefined) return 0;
  const cleaned = String(text).replace(/[^0-9]/g, '');
  if (cleaned === '') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

// Keep an amount inside sane bounds for the tools.
export function clampAmount(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(999999999, Math.floor(n)));
}

// Escape text that came from the user before it goes into HTML.
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
