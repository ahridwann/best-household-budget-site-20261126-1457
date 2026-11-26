// Household Ledger — charts: hand-drawn inline SVG, no library, no
// network. Two builders: a donut for the spending breakdown and bars
// for the monthly trend. Both take plain numbers and return SVG text.
import { formatIDR, formatShort } from './format.js';

const DONUT_COLORS = ['#0e4f4a', '#e8a33d', '#c65d3b', '#7ba05b', '#4a7fa5', '#8a6fb8', '#b85c7a', '#5b8c8a', '#a67c52', '#6b7c93'];

// A donut of `slices` [{label, value}], with a centre total. Slices
// with no value are skipped; a single slice draws a full ring.
export function donutChart(slices, total) {
  const usable = slices.filter((s) => s.value > 0);
  const sum = usable.reduce((a, s) => a + s.value, 0);
  if (sum <= 0) {
    return '<svg viewBox="0 0 220 220" role="img" aria-label="No spending yet"><circle cx="110" cy="110" r="80" fill="none" stroke="#e3efec" stroke-width="34"/><text x="110" y="105" text-anchor="middle" class="donut-centre">Rp 0</text><text x="110" y="128" text-anchor="middle" class="donut-sub">nothing planned</text></svg>';
  }
  const r = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  let arcs = '';
  usable.forEach((s, i) => {
    const frac = s.value / sum;
    const len = Math.max(frac * circ - 2, 0.5);
    arcs += '<circle cx="110" cy="110" r="' + r + '" fill="none" stroke="' + DONUT_COLORS[i % DONUT_COLORS.length] + '" stroke-width="34" stroke-dasharray="' + len.toFixed(1) + ' ' + (circ - len).toFixed(1) + '" stroke-dashoffset="' + (-offset).toFixed(1) + '" transform="rotate(-90 110 110)"><title>' + s.label + ': ' + formatIDR(s.value) + '</title></circle>';
    offset += frac * circ;
  });
  return '<svg viewBox="0 0 220 220" role="img" aria-label="Spending breakdown donut">' + arcs +
    '<text x="110" y="104" text-anchor="middle" class="donut-centre">' + formatShort(total) + '</text>' +
    '<text x="110" y="126" text-anchor="middle" class="donut-sub">per month</text></svg>';
}

// A legend row for the donut: colour dot, name, amount, share.
export function donutLegend(slices, total) {
  return slices
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const pct = total > 0 ? ((s.value / total) * 100).toFixed(1).replace('.', ',') : '0';
      return '<li><span class="dot" style="background:' + DONUT_COLORS[i % DONUT_COLORS.length] + '"></span><span class="leg-name">' + s.label + '</span><span class="leg-amount">' + formatIDR(s.value) + '</span><span class="leg-pct">' + pct + '%</span></li>';
    })
    .join('');
}

// Vertical bars for `rows` [{month, amount}], each bar clickable to
// edit that month (the view wires the click). `max` scales the chart.
export function barChart(rows) {
  const max = Math.max(...rows.map((r) => r.amount), 1);
  const w = 640;
  const h = 260;
  const base = 220;
  const slot = w / rows.length;
  const barW = Math.min(64, slot * 0.55);
  let bars = '';
  let labels = '';
  rows.forEach((r, i) => {
    const bh = Math.max((r.amount / max) * 180, 4);
    const x = i * slot + (slot - barW) / 2;
    const y = base - bh;
    const current = i === rows.length - 1;
    bars += '<g class="bar" data-month="' + r.month + '" tabindex="0" role="button" aria-label="Edit ' + r.month + '"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW + '" height="' + bh.toFixed(1) + '" rx="5" fill="' + (current ? '#c65d3b' : '#0e4f4a') + '"><title>' + r.month + ': ' + formatIDR(r.amount) + '</title></rect>' +
      '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (y - 8).toFixed(1) + '" text-anchor="middle" class="bar-value">' + formatShort(r.amount) + '</text></g>';
    labels += '<text x="' + (i * slot + slot / 2).toFixed(1) + '" y="' + (base + 22) + '" text-anchor="middle" class="bar-label">' + r.month + '</text>';
  });
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Monthly spending bars">' +
    '<line x1="0" y1="' + base + '" x2="' + w + '" y2="' + base + '" stroke="#d8ddd5" stroke-width="1"/>' + bars + labels + '</svg>';
}
