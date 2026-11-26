// Household Ledger — views: one renderer per page. Each returns the
// HTML for its route; main.js mounts it and wires the events. Every
// figure on these pages is computed from the state, never typed in.
import { BPS_SOURCE, BPS_SERIES_SOURCE, NATIONAL_SERIES, TIPS, PER_CAPITA, householdAmount } from './data.js';
import { formatIDR, formatShort, formatPct, escapeHtml } from './format.js';
import { getState, totalIncome, totalPlanned, totalSpent, spentByCategory, leftToAssign, leftToSpend } from './state.js';
import { donutChart, donutLegend, barChart } from './charts.js';

function moneyInput(value, attrs) {
  return '<input type="text" inputmode="numeric" value="' + formatIDR(value).replace('Rp ', '') + '" ' + attrs + '>';
}

function statCard(label, value, note, id) {
  return '<div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value" id="' + id + '">' + value + '</span><span class="stat-note">' + note + '</span></div>';
}

// --- Overview: the month at a glance. ---

export function renderOverview() {
  const s = getState();
  const income = totalIncome();
  const planned = totalPlanned();
  const spent = totalSpent();
  const left = leftToSpend();
  const rate = planned > 0 ? formatPct(planned - spent, planned) : '—';
  const slices = s.categories.map((c) => ({ label: c.name, value: s.planned[c.key] || 0 }));
  const byCat = spentByCategory();
  const top = [...s.categories]
    .map((c) => ({ name: c.name, spent: byCat[c.key] || 0, plan: s.planned[c.key] || 0 }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 4);
  const recent = [...s.expenses].slice(-4).reverse();
  const goals = s.goals.map((g) => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
    return '<li><a href="#/goals"><span class="goal-name">' + escapeHtml(g.name) + '</span><span class="goal-bar"><span style="width:' + pct + '%"></span></span><span class="goal-pct">' + pct + '%</span></a></li>';
  }).join('');
  return '' +
    '<section class="hero"><h1>One household, one month, every rupiah with a job.</h1>' +
    '<p>Household Ledger plans a month of money for a family of four, from the national average spending published by BPS — then lets you replace every figure with your own.</p>' +
    '<p class="hero-links"><a class="btn" href="#/planner">Plan this month</a> <a class="btn ghost" href="#/tracker">Log an expense</a></p></section>' +
    '<section class="stats" aria-label="Month summary">' +
    statCard('Monthly income', formatIDR(income), 'take-home pay + other income', 'ov-income') +
    statCard('Planned spending', formatIDR(planned), 'all categories, from the planner', 'ov-planned') +
    statCard('Spent so far', formatIDR(spent), 'logged in the tracker', 'ov-spent') +
    statCard('Left to spend', formatIDR(left), formatPct(left, planned) + ' of the plan remains', 'ov-left') +
    '</section>' +
    '<section class="grid-two"><div class="card"><h2>Where the month goes</h2>' +
    '<div class="donut-wrap">' + donutChart(slices, planned) + '<ul class="legend">' + donutLegend(slices, planned) + '</ul></div>' +
    '<p class="fine">Planned spending for a 4-person household at the national average: ' + formatIDR(householdAmount(PER_CAPITA.total)) + ' a month. Food alone is ' + formatPct(PER_CAPITA.food, PER_CAPITA.total) + ' of it.</p>' +
    '<p><a href="#/planner">Edit the plan &rarr;</a></p></div>' +
    '<div class="card"><h2>Spent vs planned</h2><ul class="vs-list">' +
    top.map((t) => '<li><span class="vs-name">' + escapeHtml(t.name) + '</span><span class="vs-bar"><span style="width:' + (t.plan > 0 ? Math.min(100, Math.round((t.spent / t.plan) * 100)) : 0) + '%"></span></span><span class="vs-num">' + formatShort(t.spent) + ' / ' + formatShort(t.plan) + '</span></li>').join('') +
    '</ul><p class="fine">' + rate + ' of the plan is still unspent in November.</p><p><a href="#/tracker">Open the tracker &rarr;</a></p></div></section>' +
    '<section class="grid-two"><div class="card"><h2>Savings goals</h2><ul class="goal-list">' + goals + '</ul><p><a href="#/goals">Manage goals &rarr;</a></p></div>' +
    '<div class="card"><h2>Recent expenses</h2><ul class="recent">' +
    recent.map((e) => '<li><span class="rec-date">' + e.date.slice(5) + '</span><span class="rec-note">' + escapeHtml(e.note) + '</span><span class="rec-amount">' + formatIDR(e.amount) + '</span></li>').join('') +
    '</ul><p><a href="#/tracker">See all expenses &rarr;</a></p></div></section>' +
    '<section class="card"><h2>How the example is built</h2><p>The default household spends the national average: Rp 1,500,556 per person a month in Susenas March 2024, times 4 people. ' +
    'Source: ' + BPS_SOURCE + '. Edit any figure — the whole site recomputes from your numbers, and your edits stay on this device.</p>' +
    '<p><a href="#/trends">See the national trend &rarr;</a> &nbsp; <a href="#/tips">Money checklist &rarr;</a></p></section>';
}

// --- Planner: income, categories, totals. ---

export function renderPlanner() {
  const s = getState();
  const income = totalIncome();
  const planned = totalPlanned();
  const left = leftToAssign();
  const incomeRows = s.income.map((l) =>
    '<tr><td>' + escapeHtml(l.name) + (l.note ? '<br><span class="fine">' + escapeHtml(l.note) + '</span>' : '') + '</td>' +
    '<td class="num">' + moneyInput(l.amount, 'data-income="' + l.id + '" aria-label="Amount for ' + escapeHtml(l.name) + '"') + '</td></tr>').join('');
  const catRows = s.categories.map((c) => {
    const amount = s.planned[c.key] || 0;
    const share = planned > 0 ? formatPct(amount, planned) : '0%';
    const remove = c.builtin ? '' : '<button class="mini danger" data-action="remove-category" data-key="' + c.key + '">Remove</button>';
    return '<tr><td>' + escapeHtml(c.name) + '</td>' +
      '<td class="num">' + moneyInput(amount, 'data-plan="' + c.key + '" aria-label="Planned amount for ' + escapeHtml(c.name) + '"') + '</td>' +
      '<td class="num share">' + share + '</td><td>' + remove + '</td></tr>';
  }).join('');
  return '' +
    '<section class="page-head"><h1>Monthly budget planner</h1><p>Set income and what each category may spend. Every total below recomputes as you type.</p></section>' +
    '<section class="stats" aria-label="Plan totals">' +
    statCard('Monthly income', formatIDR(income), 'edit the lines below', 'pl-income') +
    statCard('Planned spending', formatIDR(planned), 'all categories', 'pl-planned') +
    statCard('Left to assign', formatIDR(left), left === 0 ? 'every rupiah has a job' : left > 0 ? 'unassigned — give it a category' : 'over budget — trim a category', 'pl-left') +
    '</section>' +
    '<section class="grid-two"><div class="card"><h2>Income</h2><table class="sheet"><thead><tr><th>Source</th><th class="num">Amount / month</th></tr></thead><tbody>' +
    incomeRows + '</tbody></table><p class="fine">Example income is set to the national average spending so the example balances. Replace it with your household&rsquo;s take-home pay.</p></div>' +
    '<div class="card"><h2>How much is food, really?</h2><p>Food is ' + formatPct(PER_CAPITA.food, PER_CAPITA.total) + ' of the average Indonesian household&rsquo;s spending — Rp 751,790 per person a month in March 2024. Housing and facilities are the biggest non-food line at Rp 391,751 per person.</p>' +
    '<p class="fine">Source: ' + BPS_SOURCE + '.</p></div></section>' +
    '<section class="card"><h2>Planned spending by category</h2><table class="sheet"><thead><tr><th>Category</th><th class="num">Planned / month</th><th class="num">Share</th><th></th></tr></thead><tbody>' +
    catRows + '</tbody></table>' +
    '<form class="add-row" data-form="add-category"><label>New category <input type="text" name="cat-name" placeholder="e.g. School fees" maxlength="40" required></label>' +
    '<label>Planned amount <input type="text" inputmode="numeric" name="cat-amount" placeholder="0"></label>' +
    '<button class="btn" type="submit">Add category</button></form>' +
    '<p class="fine">Defaults are the BPS Susenas March 2024 averages for a 4-person household. Add your own categories; removing a custom category also removes its expenses.</p></section>';
}

// --- Tracker: log expenses, running totals. ---

export function renderTracker() {
  const s = getState();
  const spent = totalSpent();
  const byCat = spentByCategory();
  const catTotals = s.categories.map((c) => {
    const v = byCat[c.key] || 0;
    return '<li><span class="leg-name">' + escapeHtml(c.name) + '</span><span class="leg-amount">' + formatIDR(v) + '</span></li>';
  }).join('');
  const rows = [...s.expenses].reverse().map((e) => {
    const cat = s.categories.find((c) => c.key === e.category);
    return '<tr><td>' + e.date + '</td><td>' + escapeHtml(cat ? cat.name : e.category) + '</td><td>' + escapeHtml(e.note) + '</td>' +
      '<td class="num">' + formatIDR(e.amount) + '</td><td><button class="mini danger" data-action="remove-expense" data-id="' + e.id + '">Remove</button></td></tr>';
  }).join('');
  const options = s.categories.map((c) => '<option value="' + c.key + '">' + escapeHtml(c.name) + '</option>').join('');
  return '' +
    '<section class="page-head"><h1>Expense tracker</h1><p>Log what leaves the wallet. Totals update the moment an expense is added or removed.</p></section>' +
    '<section class="stats" aria-label="Tracker totals">' +
    statCard('Spent in November', formatIDR(spent), s.expenses.length + ' expenses logged', 'tr-total') +
    statCard('Planned for November', formatIDR(totalPlanned()), 'from the planner', 'tr-planned') +
    statCard('Left to spend', formatIDR(leftToSpend()), 'planned minus spent', 'tr-left') +
    '</section>' +
    '<section class="grid-two"><div class="card"><h2>Add an expense</h2>' +
    '<form data-form="add-expense" class="stack"><label>Date <input type="date" name="ex-date" value="2026-11-26" required></label>' +
    '<label>Category <select name="ex-cat">' + options + '</select></label>' +
    '<label>What was it? <input type="text" name="ex-note" placeholder="e.g. Weekly groceries" maxlength="80" required></label>' +
    '<label>Amount (Rp) <input type="text" inputmode="numeric" name="ex-amount" placeholder="0" required></label>' +
    '<button class="btn" type="submit">Add expense</button></form></div>' +
    '<div class="card"><h2>Spent by category</h2><ul class="legend">' + catTotals + '</ul>' +
    '<p class="fine">Groceries here are a quarter of the monthly food figure — one week of the average household&rsquo;s food spending (Rp 3,007,160 a month).</p></div></section>' +
    '<section class="card"><h2>November expenses</h2><table class="sheet"><thead><tr><th>Date</th><th>Category</th><th>What</th><th class="num">Amount</th><th></th></tr></thead><tbody>' +
    rows + '</tbody></table></section>';
}

// --- Goals: savings targets with progress. ---

export function renderGoals() {
  const s = getState();
  const cards = s.goals.map((g) => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
    const remaining = Math.max(0, g.target - g.saved);
    return '<article class="goal-card"><h3>' + escapeHtml(g.name) + '</h3>' +
      '<div class="goal-bar big"><span style="width:' + pct + '%"></span></div>' +
      '<p class="goal-nums"><strong id="goal-saved-' + g.id + '">' + formatIDR(g.saved) + '</strong> of ' + formatIDR(g.target) + ' &middot; ' + pct + '%</p>' +
      '<p class="fine">' + escapeHtml(g.note) + ' &middot; target date ' + escapeHtml(g.due) + ' &middot; ' + formatIDR(remaining) + ' to go</p>' +
      '<form class="add-row" data-form="add-goal-money" data-goal="' + g.id + '"><label>Add savings <input type="text" inputmode="numeric" name="amount" placeholder="0" required></label>' +
      '<button class="btn" type="submit">Add</button></form>' +
      '<p><button class="mini danger" data-action="remove-goal" data-id="' + g.id + '">Remove goal</button></p></article>';
  }).join('');
  return '' +
    '<section class="page-head"><h1>Savings goals</h1><p>Targets with a date and a progress bar. Add money as you save it; the bar moves at once.</p></section>' +
    '<section class="goals-grid">' + cards + '</section>' +
    '<section class="card"><h2>Start a new goal</h2>' +
    '<form class="add-row wrap" data-form="add-goal"><label>Goal <input type="text" name="goal-name" placeholder="e.g. New motorcycle" maxlength="40" required></label>' +
    '<label>Target (Rp) <input type="text" inputmode="numeric" name="goal-target" placeholder="0" required></label>' +
    '<label>Target date <input type="text" name="goal-due" placeholder="e.g. Dec 2027" maxlength="20"></label>' +
    '<button class="btn" type="submit">Add goal</button></form>' +
    '<p class="fine">The example emergency fund aims at three months of spending — Rp 18,006,672 for this household — the usual cushion against a lost income. Targets here are your household&rsquo;s own choices; the example ones are built from the same BPS averages as the planner.</p></section>';
}

// --- Trends: monthly bars plus the national series. ---

export function renderTrends() {
  const s = getState();
  const amounts = s.trend.map((t) => t.amount);
  const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
  const rows = s.trend.map((t) => '<li><span class="leg-name">' + t.month + '</span><span class="leg-amount">' + formatIDR(t.amount) + '</span><span class="fine">' + escapeHtml(t.note) + '</span></li>').join('');
  const series = NATIONAL_SERIES.map((p) => '<li><span class="leg-name">' + p.label + '</span><span class="leg-amount">' + formatIDR(p.value) + ' per person</span></li>').join('');
  return '' +
    '<section class="page-head"><h1>Monthly trend</h1><p>Six months of household spending. Tap any bar to edit that month — the average recomputes at once.</p></section>' +
    '<section class="stats" aria-label="Trend summary">' +
    statCard('6-month average', formatIDR(avg), 'mean of the six months below', 'trend-avg') +
    statCard('Highest month', formatIDR(Math.max(...amounts)), 'of the six shown', 'trend-max') +
    statCard('November so far', formatIDR(s.trend[s.trend.length - 1].amount), 'in progress — from the tracker', 'trend-nov') +
    '</section>' +
    '<section class="card"><h2>Household spending, Jun – Nov 2026</h2><div id="trend-chart">' + barChart(s.trend) + '</div>' +
    '<div id="trend-edit" class="trend-edit" hidden><label>Edit <span id="trend-edit-month"></span> (Rp) <input type="text" inputmode="numeric" id="trend-edit-amount"></label>' +
    '<button class="btn" id="trend-edit-save" type="button">Save month</button></div>' +
    '<ul class="legend">' + rows + '</ul>' +
    '<p class="fine">Past months start at the national average for a 4-person household — edit any of them to your real spending. November follows the tracker, so logging an expense moves its bar too.</p></section>' +
    '<section class="card"><h2>How the national average has grown</h2><ul class="legend">' + series + '</ul>' +
    '<p class="fine">Average monthly expenditure per person, Indonesia. 2010 and 2024: ' + BPS_SERIES_SOURCE + '. The average more than tripled in fourteen years — a budget that never moves is a budget that quietly shrinks.</p></section>';
}

// --- Tips: checklist plus practical guidance. ---

export function renderTips() {
  const s = getState();
  const done = s.checklist.filter((c) => c.done).length;
  const items = s.checklist.map((c) =>
    '<li><label><input type="checkbox" data-check="' + c.id + '"' + (c.done ? ' checked' : '') + '> <span>' + escapeHtml(c.text) + '</span></label></li>').join('');
  const tips = TIPS.map((t) => '<article class="tip"><h3>' + escapeHtml(t.title) + '</h3><p>' + escapeHtml(t.body) + '</p></article>').join('');
  return '' +
    '<section class="page-head"><h1>Tips &amp; checklist</h1><p>What actually works for a household budget — and a monthly checklist to keep it working.</p></section>' +
    '<section class="card"><h2>Monthly checklist <span class="fine" id="check-count">' + done + ' of ' + s.checklist.length + ' done</span></h2>' +
    '<ul class="checklist">' + items + '</ul>' +
    '<p><button class="btn ghost" data-action="reset-all" type="button">Reset the example household</button> <span class="fine">Restores the BPS example figures and clears your edits.</span></p></section>' +
    '<section class="tips-grid">' + tips + '</section>' +
    '<section class="card"><h2>Where the numbers come from</h2><p>' + BPS_SOURCE + '. ' +
    'Per-capita monthly expenditure, March 2024: total Rp 1,500,556; food Rp 751,790; housing &amp; facilities Rp 391,751; goods &amp; services Rp 180,325; clothing &amp; footwear Rp 35,457; durable goods Rp 52,545; taxes &amp; insurance Rp 60,362; parties &amp; ceremonies Rp 28,326. ' +
    'The example household multiplies these by 4 people, the average household size in Susenas 2024. Nothing on this site is fetched from the network; your edits are stored only in this browser.</p></section>';
}
