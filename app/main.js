// Household Ledger — main: the hash router and the event wiring.
// One route per page, all linked from the header nav. Edits update
// the state and refresh only the numbers on screen, so a field never
// loses focus while it is being typed in; structural changes
// (add/remove) re-render the current page.
import { loadState, getState, setIncomeAmount, setPlannedAmount, addCategory, removeCategory, addExpense, removeExpense, addToGoal, addGoal, removeGoal, toggleChecklist, setTrendMonth, resetState, totalIncome, totalPlanned, totalSpent, leftToAssign, leftToSpend } from './state.js';
import { parseAmount, formatIDR, formatPct } from './format.js';
import { renderOverview, renderPlanner, renderTracker, renderGoals, renderTrends, renderTips } from './views.js';

const ROUTES = {
  '': { render: renderOverview, title: 'Household Ledger — A monthly budget for one household' },
  'planner': { render: renderPlanner, title: 'Monthly budget planner — Household Ledger' },
  'tracker': { render: renderTracker, title: 'Expense tracker — Household Ledger' },
  'goals': { render: renderGoals, title: 'Savings goals — Household Ledger' },
  'trends': { render: renderTrends, title: 'Monthly trend — Household Ledger' },
  'tips': { render: renderTips, title: 'Tips & checklist — Household Ledger' },
};

const view = document.getElementById('view');
const nav = document.getElementById('nav');

function route() {
  const key = (window.location.hash || '#/').replace(/^#\/?/, '').split('/')[0];
  return ROUTES[key] ? key : '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Refresh every total the current page shows, from the state.
function refreshTotals() {
  const s = getState();
  const income = totalIncome();
  const planned = totalPlanned();
  const spent = totalSpent();
  const leftAssign = leftToAssign();
  const leftSpend = leftToSpend();
  setText('ov-income', formatIDR(income));
  setText('ov-planned', formatIDR(planned));
  setText('ov-spent', formatIDR(spent));
  setText('ov-left', formatIDR(leftSpend));
  setText('pl-income', formatIDR(income));
  setText('pl-planned', formatIDR(planned));
  setText('pl-left', formatIDR(leftAssign));
  setText('tr-total', formatIDR(spent));
  setText('tr-planned', formatIDR(planned));
  setText('tr-left', formatIDR(leftSpend));
  setText('trend-avg', formatIDR(Math.round(s.trend.reduce((a, t) => a + t.amount, 0) / s.trend.length)));
  setText('trend-max', formatIDR(Math.max(...s.trend.map((t) => t.amount))));
  setText('trend-nov', formatIDR(s.trend[s.trend.length - 1].amount));
  // Planner share column, in table order.
  const shares = document.querySelectorAll('td.share');
  shares.forEach((cell, i) => {
    const cat = s.categories[i];
    if (cat) cell.textContent = planned > 0 ? formatPct(s.planned[cat.key] || 0, planned) : '0%';
  });
  // Checklist counter.
  const done = s.checklist.filter((c) => c.done).length;
  setText('check-count', done + ' of ' + s.checklist.length + ' done');
}

function mount() {
  const key = route();
  const page = ROUTES[key];
  view.innerHTML = page.render();
  document.title = page.title;
  for (const link of nav.querySelectorAll('a')) {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === '#/' + key || (key === '' && href === '#/'));
    if (href === '#/' + key || (key === '' && href === '#/')) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

loadState();
mount();
window.addEventListener('hashchange', mount);

// Live editing: parse the field, save, refresh the numbers in place.
document.addEventListener('input', (event) => {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return;
  if (el.hasAttribute('data-income')) {
    setIncomeAmount(el.getAttribute('data-income'), parseAmount(el.value));
    refreshTotals();
  } else if (el.hasAttribute('data-plan')) {
    setPlannedAmount(el.getAttribute('data-plan'), parseAmount(el.value));
    refreshTotals();
  }
});

// Re-format a money field when the user leaves it.
document.addEventListener('change', (event) => {
  const el = event.target;
  if (el instanceof HTMLInputElement && (el.hasAttribute('data-income') || el.hasAttribute('data-plan'))) {
    el.value = formatIDR(parseAmount(el.value)).replace('Rp ', '');
  }
  if (el instanceof HTMLInputElement && el.hasAttribute('data-check')) {
    toggleChecklist(el.getAttribute('data-check'));
    refreshTotals();
  }
});

// Forms: add a category, an expense, goal money, a goal.
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  const kind = form.getAttribute('data-form');
  if (!kind) return;
  event.preventDefault();
  const data = new FormData(form);
  if (kind === 'add-category') {
    const key = addCategory(data.get('cat-name'));
    if (key) setPlannedAmount(key, parseAmount(data.get('cat-amount')));
    mount();
  } else if (kind === 'add-expense') {
    addExpense({ date: data.get('ex-date'), category: data.get('ex-cat'), note: data.get('ex-note'), amount: parseAmount(data.get('ex-amount')) });
    mount();
  } else if (kind === 'add-goal-money') {
    addToGoal(form.getAttribute('data-goal'), parseAmount(data.get('amount')));
    mount();
  } else if (kind === 'add-goal') {
    addGoal({ name: data.get('goal-name'), target: parseAmount(data.get('goal-target')), due: data.get('goal-due') });
    mount();
  }
});

// Buttons: remove things, reset the example, edit a trend month.
document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action], .bar, #trend-edit-save');
  if (!el) return;
  if (el.classList && el.classList.contains('bar')) {
    const month = el.getAttribute('data-month');
    const row = getState().trend.find((t) => t.month === month);
    if (!row) return;
    const box = document.getElementById('trend-edit');
    if (box) {
      box.hidden = false;
      document.getElementById('trend-edit-month').textContent = month;
      const input = document.getElementById('trend-edit-amount');
      input.value = formatIDR(row.amount).replace('Rp ', '');
      input.focus();
      input.select();
    }
    return;
  }
  if (el.id === 'trend-edit-save') {
    const month = document.getElementById('trend-edit-month').textContent;
    const amount = parseAmount(document.getElementById('trend-edit-amount').value);
    setTrendMonth(month, amount);
    mount();
    return;
  }
  const action = el.getAttribute('data-action');
  if (action === 'remove-category') {
    if (removeCategory(el.getAttribute('data-key'))) mount();
  } else if (action === 'remove-expense') {
    if (removeExpense(el.getAttribute('data-id'))) mount();
  } else if (action === 'remove-goal') {
    if (removeGoal(el.getAttribute('data-id'))) mount();
  } else if (action === 'reset-all') {
    resetState();
    mount();
  }
});
