# Household Ledger

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/ahridwann/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/ahridwann/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

A monthly budget site for one household: a budget planner, an expense tracker, savings goals, a monthly trend and a money checklist — all working in the browser, with no network requests at all.

The example household is built on published numbers: the average Indonesian household spent Rp 1,500,556 per person a month in Susenas March 2024 (BPS — Statistics Indonesia), times 4 people, the average household size. Every figure on the site traces to that publication or is arithmetic on it, and the source is shown on the site itself. Edit any amount and every total, chart and goal recomputes at once; edits are stored only in the browser's local storage.

## Run it

Serve `app/` with any static server and open `index.html`:

```sh
node serve.ts
# app/ is on http://localhost:8080
```

Or open `app/index.html` directly in a browser. No build step, no dependencies, no network.

## Layout

- `app/index.html` — the shell: header, nav, footer
- `app/main.js` — the hash router and event wiring
- `app/views.js` — one renderer per page (overview, planner, tracker, goals, trends, tips)
- `app/state.js` — the household state, saved to localStorage when available
- `app/data.js` — the published BPS figures behind the example household
- `app/charts.js` — hand-drawn inline SVG donut and bar charts
- `app/format.js` — rupiah formatting helpers
- `app/style.css` — the whole look, system fonts only
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` and writes `dossier.json`
- `screenshots/` — renders of the site itself, taken in a browser

Built for the [best household budget site bounty](https://make.fun/bounty/best-household-budget-site-20261126-1457) on make.fun.

Referral: `kc98nxwf` — https://make.fun/r/kc98nxwf
