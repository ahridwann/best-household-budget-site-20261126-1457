// Household Ledger — published figures behind the example household.
//
// Every rupiah in the default budget comes from one published source:
// BPS — Statistics Indonesia, "Pengeluaran untuk Konsumsi Penduduk
// Indonesia", Susenas March 2024 (average monthly expenditure per
// capita, in rupiah). The example household has 4 people, the average
// household size in Susenas 2024, so each household figure is the
// per-capita figure x 4. No other numbers are used as defaults: income
// is set equal to the average spending total so the example balances,
// and every goal and tracker entry is arithmetic on these same figures.
// The long-run series comes from ARC Institute, "Indonesia's Health
// Landscape" (2026), reproducing BPS Susenas figures, and the March
// 2026 point from BPS, "Pengeluaran Konsumsi Maret 2026".

export const HOUSEHOLD_SIZE = 4;

export const BPS_SOURCE =
  'BPS — Statistics Indonesia, Pengeluaran untuk Konsumsi Penduduk Indonesia, Susenas March 2024';
export const BPS_SERIES_SOURCE =
  "ARC Institute, Indonesia's Health Landscape (2026), reproducing BPS Susenas figures; March 2026: BPS, Pengeluaran Konsumsi Maret 2026";

// Average monthly expenditure per capita, March 2024, rupiah.
export const PER_CAPITA = {
  total: 1500556,
  food: 751790,
  housing: 391751,
  goodsServices: 180325,
  clothing: 35457,
  durables: 52545,
  taxesInsurance: 60362,
  ceremonies: 28326,
};

// Average monthly expenditure per capita, dated points (rupiah).
export const NATIONAL_SERIES = [
  { label: '2010', value: 494845 },
  { label: 'Mar 2024', value: 1500556 },
  { label: 'Mar 2026', value: 1657281 },
];

// Household figure: per-capita value scaled to the example household.
export function householdAmount(perCapita) {
  return perCapita * HOUSEHOLD_SIZE;
}

// The planner's expense categories, in BPS order. `key` is the stable
// id used by the state; `perCapita` is the published figure.
export const CATEGORIES = [
  { key: 'food', name: 'Food', perCapita: PER_CAPITA.food },
  { key: 'housing', name: 'Housing & facilities', perCapita: PER_CAPITA.housing },
  { key: 'goods', name: 'Goods & services', perCapita: PER_CAPITA.goodsServices },
  { key: 'clothing', name: 'Clothing & footwear', perCapita: PER_CAPITA.clothing },
  { key: 'durables', name: 'Durable goods', perCapita: PER_CAPITA.durables },
  { key: 'taxes', name: 'Taxes & insurance', perCapita: PER_CAPITA.taxesInsurance },
  { key: 'ceremonies', name: 'Parties & ceremonies', perCapita: PER_CAPITA.ceremonies },
];

export const MONTHS = ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'];

// The default state: a fresh example household. Amounts are derived
// from the figures above; nothing else is hard-coded as a fact.
export function defaultState() {
  const planned = {};
  for (const c of CATEGORIES) planned[c.key] = householdAmount(c.perCapita);
  return {
    householdSize: HOUSEHOLD_SIZE,
    income: [
      { id: 'pay', name: 'Take-home pay', amount: householdAmount(PER_CAPITA.total), note: 'Example — set to the national average spending so the example balances' },
      { id: 'other', name: 'Other income', amount: 0, note: '' },
    ],
    planned,
    categories: CATEGORIES.map((c) => ({ key: c.key, name: c.name, builtin: true })),
    expenses: [
      { id: 'e1', date: '2026-11-02', category: 'food', note: 'Weekly groceries', amount: 751790 },
      { id: 'e2', date: '2026-11-05', category: 'housing', note: 'Rent & utilities', amount: 1567004 },
      { id: 'e3', date: '2026-11-09', category: 'food', note: 'Weekly groceries', amount: 751790 },
      { id: 'e4', date: '2026-11-12', category: 'goods', note: 'Transport, phone & household items', amount: 721300 },
      { id: 'e5', date: '2026-11-16', category: 'food', note: 'Weekly groceries', amount: 751790 },
      { id: 'e6', date: '2026-11-20', category: 'clothing', note: 'School shoes & uniforms', amount: 141828 },
    ],
    goals: [
      { id: 'g1', name: 'Emergency fund', target: householdAmount(PER_CAPITA.total) * 3, saved: householdAmount(PER_CAPITA.total), due: 'Dec 2027', note: 'Three months of spending, one month saved' },
      { id: 'g2', name: 'Home repairs', target: householdAmount(PER_CAPITA.housing) * 2, saved: householdAmount(PER_CAPITA.housing), due: 'Jun 2027', note: 'Two months of housing costs, one month saved' },
      { id: 'g3', name: 'Holiday fund', target: householdAmount(PER_CAPITA.food), saved: 1503580, due: 'Mar 2027', note: 'One month of food spending, half saved' },
    ],
    trend: [
      { month: 'Jun 2026', amount: householdAmount(PER_CAPITA.total), note: 'national average' },
      { month: 'Jul 2026', amount: householdAmount(PER_CAPITA.total), note: 'national average' },
      { month: 'Aug 2026', amount: householdAmount(PER_CAPITA.total), note: 'national average' },
      { month: 'Sep 2026', amount: householdAmount(PER_CAPITA.total), note: 'national average' },
      { month: 'Oct 2026', amount: householdAmount(PER_CAPITA.total), note: 'national average' },
      { month: 'Nov 2026', amount: 4685502, note: 'in progress — from the tracker' },
    ],
    checklist: [
      { id: 'c1', text: 'Write down every income for the month', done: true },
      { id: 'c2', text: 'Give every rupiah a job before the month starts', done: true },
      { id: 'c3', text: 'Keep food spending near half of the budget', done: false },
      { id: 'c4', text: 'Pay housing and utilities first', done: false },
      { id: 'c5', text: 'Move savings out on payday, not at month end', done: false },
      { id: 'c6', text: 'Log each expense the day it happens', done: false },
      { id: 'c7', text: 'Compare planned vs spent every Sunday', done: false },
      { id: 'c8', text: 'Review the month and reset the plan on the 1st', done: false },
    ],
  };
}

export const TIPS = [
  {
    title: 'Food is half the budget — start there',
    body: 'In Susenas March 2024 the average Indonesian household spent 50.1% of its money on food. A weekly shop list and one planned market day cut the biggest line first; eating out is the part of it that slips most easily.',
  },
  {
    title: 'Pay housing first, then save',
    body: 'Housing and household facilities are the largest non-food line at Rp 391,751 per person a month (BPS, March 2024). Settle rent, electricity and water on payday, then move savings out the same day — money left in the spending account gets spent.',
  },
  {
    title: 'Give every rupiah a job',
    body: 'A zero-based plan assigns income to a category until nothing is left unassigned. When the planner shows "left to assign: Rp 0", the month is fully planned, not short — adjust a category instead of leaving money vague.',
  },
  {
    title: 'Track spending the day it happens',
    body: 'A budget fails on forgotten small amounts, not on big ones. Log each expense in the tracker the same day; the running totals show at once which category is running hot while there is still time to slow it.',
  },
  {
    title: 'Keep three months aside',
    body: 'An emergency fund of three months of spending — Rp 18,006,672 for the example household — covers a lost income or a broken roof without debt. Build it a month at a time; one month saved is already a third of the way there.',
  },
  {
    title: 'Compare planned vs spent weekly',
    body: 'A Sunday check takes five minutes: open the tracker, compare each category with its plan, and move money between categories before the month runs out. Plans are meant to be revised, not worshipped.',
  },
  {
    title: 'Small lines add up quietly',
    body: 'Clothing, durable goods, taxes and ceremonies are small alone — Rp 35,457 to Rp 60,362 per person a month each — but together they pass Rp 750,000 a month for a family of four. Give each its own line so none of them hides inside "other".',
  },
  {
    title: 'Use the national average as a mirror, not a rule',
    body: 'The average household spent Rp 1,500,556 per person a month in March 2024 (Rp 1,657,281 by March 2026). If your food share is far above 50%, that is the first place to look; if your housing share is far above, the second. Your household is the authority — the average is only the comparison.',
  },
];
