// Household Ledger — state: one in-memory copy of the household's
// budget, saved to localStorage when the browser allows it and kept
// working fully in memory when it does not. Nothing here fetches
// anything: the state is the example household plus the user's edits.
import { defaultState } from './data.js';
import { clampAmount } from './format.js';

const KEY = 'household-ledger-v1';

let storageOK = true;
let state = defaultState();

function readStored() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    storageOK = false;
    return null;
  }
}

function writeStored() {
  if (!storageOK) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
  }
}

// Merge a stored state over the defaults so older saves and new
// fields never break the tools: missing pieces fall back to defaults.
function mergeState(stored) {
  const fresh = defaultState();
  if (!stored) return fresh;
  const out = { ...fresh, ...stored };
  out.income = Array.isArray(stored.income) && stored.income.length ? stored.income : fresh.income;
  out.planned = { ...fresh.planned, ...(stored.planned || {}) };
  out.categories = Array.isArray(stored.categories) && stored.categories.length ? stored.categories : fresh.categories;
  out.expenses = Array.isArray(stored.expenses) ? stored.expenses : fresh.expenses;
  out.goals = Array.isArray(stored.goals) ? stored.goals : fresh.goals;
  out.trend = Array.isArray(stored.trend) && stored.trend.length ? stored.trend : fresh.trend;
  out.checklist = Array.isArray(stored.checklist) ? stored.checklist : fresh.checklist;
  return out;
}

export function loadState() {
  state = mergeState(readStored());
  return state;
}

export function getState() {
  return state;
}

export function storageAvailable() {
  return storageOK;
}

export function resetState() {
  state = defaultState();
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    storageOK = false;
  }
  return state;
}

function save() {
  writeStored();
}

let nextId = 1;
export function newId(prefix) {
  nextId += 1;
  return prefix + Date.now().toString(36) + nextId.toString(36);
}

// --- Derived totals: every view reads these, never its own math. ---

export function totalIncome() {
  return state.income.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

export function totalPlanned() {
  return state.categories.reduce((sum, c) => sum + (Number(state.planned[c.key]) || 0), 0);
}

export function totalSpent() {
  return state.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

export function spentByCategory() {
  const byCat = {};
  for (const c of state.categories) byCat[c.key] = 0;
  for (const e of state.expenses) {
    if (byCat[e.category] === undefined) byCat[e.category] = 0;
    byCat[e.category] += Number(e.amount) || 0;
  }
  return byCat;
}

export function leftToAssign() {
  return totalIncome() - totalPlanned();
}

export function leftToSpend() {
  return totalPlanned() - totalSpent();
}

// --- Mutations: each one saves and returns the new state. ---

export function setIncomeAmount(id, amount) {
  const line = state.income.find((l) => l.id === id);
  if (line) line.amount = clampAmount(amount);
  save();
  return state;
}

export function setPlannedAmount(key, amount) {
  state.planned[key] = clampAmount(amount);
  save();
  return state;
}

export function addCategory(name) {
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean) return null;
  const key = 'c' + newId('');
  state.categories.push({ key, name: clean, builtin: false });
  state.planned[key] = 0;
  save();
  return key;
}

export function removeCategory(key) {
  const cat = state.categories.find((c) => c.key === key);
  if (!cat || cat.builtin) return false;
  state.categories = state.categories.filter((c) => c.key !== key);
  delete state.planned[key];
  state.expenses = state.expenses.filter((e) => e.category !== key);
  save();
  return true;
}

export function renameCategory(key, name) {
  const cat = state.categories.find((c) => c.key === key);
  if (!cat) return false;
  const clean = String(name || '').trim().slice(0, 40);
  if (!clean) return false;
  cat.name = clean;
  save();
  return true;
}

export function addExpense({ date, category, note, amount }) {
  const entry = {
    id: newId('e'),
    date: date || new Date().toISOString().slice(0, 10),
    category,
    note: String(note || '').trim().slice(0, 80) || 'Expense',
    amount: clampAmount(amount),
  };
  state.expenses.push(entry);
  state.expenses.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  save();
  return entry;
}

export function removeExpense(id) {
  const before = state.expenses.length;
  state.expenses = state.expenses.filter((e) => e.id !== id);
  save();
  return state.expenses.length < before;
}

export function addToGoal(id, amount) {
  const goal = state.goals.find((g) => g.id === id);
  if (!goal) return false;
  goal.saved = clampAmount((Number(goal.saved) || 0) + clampAmount(amount));
  if (goal.saved > goal.target) goal.saved = goal.target;
  save();
  return true;
}

export function addGoal({ name, target, due }) {
  const clean = String(name || '').trim().slice(0, 40);
  const t = clampAmount(target);
  if (!clean || t <= 0) return null;
  const goal = { id: newId('g'), name: clean, target: t, saved: 0, due: String(due || '').trim().slice(0, 20) || '—', note: 'New goal' };
  state.goals.push(goal);
  save();
  return goal;
}

export function removeGoal(id) {
  const before = state.goals.length;
  state.goals = state.goals.filter((g) => g.id !== id);
  save();
  return state.goals.length < before;
}

export function toggleChecklist(id) {
  const item = state.checklist.find((c) => c.id === id);
  if (!item) return false;
  item.done = !item.done;
  save();
  return true;
}

export function setTrendMonth(month, amount) {
  const row = state.trend.find((t) => t.month === month);
  if (!row) return false;
  row.amount = clampAmount(amount);
  row.note = 'edited';
  save();
  return true;
}
