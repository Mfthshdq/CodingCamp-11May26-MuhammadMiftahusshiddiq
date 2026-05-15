# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a zero-dependency, client-side web application delivered as three files: one HTML, one CSS, and one JavaScript. It runs entirely in the browser from the `file://` protocol with no build step, no package manager, and no backend. Chart.js is loaded via CDN `<script>` tag.

The application lets users record expense transactions (name, amount, category), view a running total balance, visualise spending by category in a live pie chart, toggle dark/light mode, set a spending-limit highlight threshold, and sort the transaction list. All state is persisted in `localStorage`.

### Key Design Decisions

- **Single-file JS module pattern**: All logic lives in `js/app.js`. A module-like IIFE (Immediately Invoked Function Expression) wraps the code to avoid polluting the global scope while remaining compatible with `file://` (no ES module `type="module"` to avoid CORS issues on some browsers when opened locally).
- **Event-driven state updates**: A central `render()` function re-draws the transaction list, balance, and chart whenever state changes. This keeps the UI consistent without a framework.
- **No build tools**: Vanilla JS with no transpilation. All syntax must be supported natively in the latest stable Chrome, Firefox, Edge, and Safari.
- **Chart.js via CDN**: Loaded with a `<script>` tag before `app.js`. The chart instance is stored in a module-level variable and updated via `chart.data` + `chart.update()` to avoid re-creating the canvas context on every change.

---

## Architecture

The application follows a simple **State → Render** loop:

```
User Interaction
      │
      ▼
 Event Handler  ──► mutateState()  ──► persistToStorage()
                                              │
                                              ▼
                                         render()
                                    ┌────────────────────┐
                                    │  renderBalance()    │
                                    │  renderList()       │
                                    │  renderChart()      │
                                    └────────────────────┘
```

There is no virtual DOM or reactive framework. State is a plain JavaScript object held in memory. Every mutation writes to `localStorage` and then calls `render()` to synchronise the UI.

### File Structure

```
project-root/
├── index.html          ← single HTML entry point
├── css/
│   └── style.css       ← all styles (layout, themes, responsive)
└── js/
    └── app.js          ← all application logic
```

### Module Boundaries (within app.js)

Although everything lives in one file, the code is organised into clearly separated logical sections:

| Section | Responsibility |
|---|---|
| **Constants** | localStorage keys, category list, sort options, validation limits |
| **State** | In-memory application state object |
| **Storage** | `loadState()`, `saveTransactions()`, `saveSpendingLimit()`, `saveTheme()` |
| **Validation** | `validateTransaction()`, `validateSpendingLimit()` |
| **State Mutations** | `addTransaction()`, `deleteTransaction()`, `setSpendingLimit()`, `setTheme()`, `setSort()` |
| **Rendering** | `render()`, `renderBalance()`, `renderList()`, `renderChart()` |
| **Chart** | Chart.js instance management (`initChart()`, `updateChart()`) |
| **Event Wiring** | `bindEvents()` — attaches all DOM event listeners |
| **Bootstrap** | `init()` — called on `DOMContentLoaded` |

---

## Components and Interfaces

### HTML Structure (`index.html`)

```
<body>
  <header>
    <h1>Expense & Budget Visualizer</h1>
    <button id="theme-toggle">🌙 / ☀️</button>
  </header>

  <main>
    <!-- Balance -->
    <section id="balance-section">
      <h2>Total Balance</h2>
      <p id="balance-display">0.00</p>
    </section>

    <!-- Storage error banner -->
    <div id="error-banner" hidden>
      Unable to load saved data. Storage may be unavailable.
      <button id="dismiss-banner">✕</button>
    </div>

    <!-- Input Form -->
    <section id="form-section">
      <form id="transaction-form">
        <input id="item-name" type="text" maxlength="100" placeholder="Item name" />
        <span id="item-name-error" class="field-error" hidden></span>

        <input id="amount" type="number" step="0.01" min="0.01" max="999999.99" placeholder="Amount" />
        <span id="amount-error" class="field-error" hidden></span>

        <select id="category">
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Fun">Fun</option>
        </select>
        <span id="category-error" class="field-error" hidden></span>

        <button type="submit">Add Transaction</button>
        <span id="storage-error" class="field-error" hidden></span>
      </form>
    </section>

    <!-- Spending Limit -->
    <section id="limit-section">
      <label for="spending-limit">Spending Limit</label>
      <input id="spending-limit" type="number" step="0.01" min="0.01" max="999999.99" placeholder="e.g. 50.00" />
      <button id="set-limit-btn">Set Limit</button>
      <span id="limit-error" class="field-error" hidden></span>
    </section>

    <!-- Sort Control -->
    <section id="sort-section">
      <label for="sort-select">Sort by</label>
      <select id="sort-select">
        <option value="default">Default (newest first)</option>
        <option value="amount-asc">Amount (Ascending)</option>
        <option value="amount-desc">Amount (Descending)</option>
        <option value="category-az">Category (A–Z)</option>
      </select>
    </section>

    <!-- Transaction List -->
    <section id="list-section">
      <h2>Transactions</h2>
      <ul id="transaction-list"></ul>
      <p id="empty-message" hidden>No transactions yet.</p>
    </section>

    <!-- Chart -->
    <section id="chart-section">
      <h2>Spending by Category</h2>
      <canvas id="spending-chart"></canvas>
      <p id="chart-empty-message" hidden>No spending data to display.</p>
    </section>
  </main>
</body>
```

### CSS Architecture (`css/style.css`)

The stylesheet uses CSS custom properties (variables) for theming, a mobile-first layout with a single breakpoint at 480px, and flexbox/grid for layout.

**Theme variables** (defined on `:root` and overridden on `body.dark`):

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --border-color: #dddddd;
  --accent-color: #4a90e2;
  --error-color: #e53935;
  --highlight-border: 4px solid #e53935;
}

body.dark {
  --bg-primary: #1e1e1e;
  --bg-secondary: #2a2a2a;
  --text-primary: #f0f0f0;
  --text-secondary: #aaaaaa;
  --border-color: #444444;
  --accent-color: #64b5f6;
}
```

**Responsive breakpoints**:
- Base (mobile-first): single-column layout, full-width inputs, chart fills container width
- `@media (min-width: 480px)`: chart constrained to max-width, form fields in a row

**Touch targets**: All `<button>` and `<select>` elements have `min-height: 44px; min-width: 44px`.

**Spending limit highlight**: `.transaction-item.over-limit { border-left: 4px solid var(--error-color); }`

### JavaScript Interface (`js/app.js`)

#### State Object

```js
const state = {
  transactions: [],   // Transaction[]
  spendingLimit: null, // number | null
  theme: 'light',     // 'light' | 'dark'
  sortOption: 'default' // 'default' | 'amount-asc' | 'amount-desc' | 'category-az'
};
```

#### Public-facing Functions (called by event handlers)

| Function | Signature | Description |
|---|---|---|
| `addTransaction` | `(name, amount, category) → void` | Validates, creates transaction, saves, renders |
| `deleteTransaction` | `(id) → void` | Removes by id, saves, renders |
| `setSpendingLimit` | `(value) → void` | Validates, sets limit, saves, renders |
| `clearSpendingLimit` | `() → void` | Clears limit, saves, renders |
| `setTheme` | `(theme) → void` | Applies theme class, saves, updates toggle icon |
| `setSort` | `(option) → void` | Updates sort state, renders |
| `render` | `() → void` | Calls all sub-render functions |

#### Validation Functions

| Function | Signature | Returns |
|---|---|---|
| `validateTransaction` | `(name, amountStr, category) → ValidationResult` | `{ valid: boolean, errors: { name?, amount?, category? } }` |
| `validateSpendingLimit` | `(valueStr) → ValidationResult` | `{ valid: boolean, error?: string }` |

#### Storage Functions

| Function | Description |
|---|---|
| `loadState()` | Reads all keys from localStorage; returns defaults on error |
| `saveTransactions()` | Serialises `state.transactions` to localStorage |
| `saveSpendingLimit()` | Saves `state.spendingLimit` to localStorage |
| `saveTheme()` | Saves `state.theme` to localStorage |

---

## Data Models

### Transaction

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id        - Unique identifier (crypto.randomUUID() or Date.now() fallback)
 * @property {string}  name      - Item name (1–100 characters, trimmed)
 * @property {number}  amount    - Positive number, max 2 decimal places, max 999999.99
 * @property {string}  category  - One of: 'Food', 'Transport', 'Fun'
 * @property {number}  timestamp - Unix ms timestamp of insertion (used for tie-breaking sort)
 */
```

### AppState

```js
/**
 * @typedef {Object} AppState
 * @property {Transaction[]} transactions  - All recorded transactions (insertion order)
 * @property {number|null}   spendingLimit - Active limit or null if unset
 * @property {'light'|'dark'} theme        - Current UI theme
 * @property {SortOption}    sortOption    - Active sort selection
 */

/**
 * @typedef {'default'|'amount-asc'|'amount-desc'|'category-az'} SortOption
 */
```

### localStorage Keys

| Key | Value type | Description |
|---|---|---|
| `ebv_transactions` | JSON string (Transaction[]) | All transactions |
| `ebv_spending_limit` | JSON string (number) | Active spending limit |
| `ebv_theme` | `'light'` or `'dark'` | Theme preference |

### Validation Rules

| Field | Rule |
|---|---|
| `name` | Non-empty after trim; max 100 characters |
| `amount` | Parseable as float; > 0; ≤ 999999.99; max 2 decimal places |
| `category` | One of `['Food', 'Transport', 'Fun']` |
| `spendingLimit` | Parseable as float; > 0; ≤ 999999.99 |

### Sorting Logic

```js
function getSortedTransactions(transactions, sortOption) {
  const copy = [...transactions];
  switch (sortOption) {
    case 'amount-asc':
      return copy.sort((a, b) => a.amount - b.amount || b.timestamp - a.timestamp);
    case 'amount-desc':
      return copy.sort((a, b) => b.amount - a.amount || b.timestamp - a.timestamp);
    case 'category-az':
      return copy.sort((a, b) => a.category.localeCompare(b.category) || b.timestamp - a.timestamp);
    default: // 'default' — insertion order, newest first
      return copy.sort((a, b) => b.timestamp - a.timestamp);
  }
}
```

### Chart Data Aggregation

```js
function getCategoryTotals(transactions) {
  // Returns { Food: number, Transport: number, Fun: number }
  // Only includes categories with total > 0
  return transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature involves pure JavaScript logic functions (validation, sorting, aggregation, balance calculation, localStorage serialisation) that are well-suited to property-based testing. The UI rendering layer (CSS responsiveness, touch targets, cross-browser layout) is excluded from PBT and covered by smoke/manual tests instead.

The recommended PBT library is **[fast-check](https://github.com/dubzzz/fast-check)** loaded via CDN for test execution in a browser console or a minimal test harness, since the project has no build tools. Alternatively, tests can be run in a Node.js scratch file using `fast-check` installed temporarily — the test files themselves are NOT committed to the project (per Requirement 11.2).

---

### Property 1: Transaction Add Round-Trip

*For any* valid transaction (non-empty name ≤ 100 chars, amount > 0 and ≤ 999999.99 with at most 2 decimal places, category in {Food, Transport, Fun}), after adding it the transaction list SHALL contain the new transaction and `localStorage` SHALL contain a serialised representation that includes the transaction's name, amount, and category.

**Validates: Requirements 1.3, 2.1, 2.3**

---

### Property 2: Empty-Field Validation Rejects Submission

*For any* combination of missing fields (name empty, amount empty, or category unselected), the validator SHALL return errors identifying each missing field and the transaction list SHALL remain unchanged.

**Validates: Requirements 1.4**

---

### Property 3: Invalid Amount Validation Rejects Submission

*For any* amount value that is zero, negative, non-numeric, or exceeds 999999.99, the validator SHALL reject it with an error message and the transaction list SHALL remain unchanged.

**Validates: Requirements 1.5**

---

### Property 4: Form Resets After Successful Add

*For any* valid transaction added through the form, all form fields (name, amount, category) SHALL be reset to their default empty/placeholder state after the transaction is successfully added.

**Validates: Requirements 1.6**

---

### Property 5: Storage Failure Leaves State Unchanged

*For any* transaction add or delete operation, if `localStorage.setItem` throws an exception, the transaction list SHALL remain unchanged and an inline error message SHALL be displayed.

**Validates: Requirements 1.7, 2.5**

---

### Property 6: Balance Equals Sum of All Transaction Amounts

*For any* non-empty set of transactions, the displayed balance SHALL equal the arithmetic sum of all transaction amounts, formatted to exactly two decimal places. When the transaction list is empty, the balance SHALL display "0.00".

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

### Property 7: Chart Data Reflects Current Category Distribution

*For any* set of transactions, the chart data SHALL contain exactly the categories that have a total amount > 0, and each category's value SHALL equal the sum of amounts for that category. Categories with zero total SHALL be omitted from the chart labels and data arrays.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 8: Transaction Delete Round-Trip

*For any* transaction list containing at least one transaction, deleting a specific transaction SHALL remove it from the rendered list and from `localStorage`, while all other transactions SHALL remain present and unchanged.

**Validates: Requirements 2.4**

---

### Property 9: Theme Persistence Round-Trip

*For any* theme value in {'light', 'dark'}, setting the theme SHALL persist it to `localStorage`, and subsequently calling `init()` (simulating a page reload) SHALL restore that theme by applying the correct CSS class to `<body>`.

**Validates: Requirements 5.3, 5.4**

---

### Property 10: Spending Limit Persistence

*For any* valid spending limit value (> 0 and ≤ 999999.99), setting it SHALL persist the value to `localStorage` so that it can be retrieved and re-applied on the next load.

**Validates: Requirements 6.2**

---

### Property 11: Spending Limit Highlight Correctness

*For any* set of transactions and any spending limit value (including null/cleared), every transaction whose amount strictly exceeds the limit SHALL have the `over-limit` CSS class applied, and every transaction whose amount is less than or equal to the limit SHALL NOT have that class. When the limit is cleared (null), no transaction SHALL have the `over-limit` class.

**Validates: Requirements 6.3, 6.4, 6.5**

---

### Property 12: Invalid Spending Limit Rejected

*For any* non-positive, non-numeric, or out-of-range value entered as a spending limit, the validator SHALL display an error message and the active spending limit SHALL remain unchanged.

**Validates: Requirements 6.6**

---

### Property 13: Sort Correctness

*For any* non-empty transaction list and any sort option (amount-asc, amount-desc, category-az, default), the rendered transaction list SHALL be ordered according to the selected sort comparator, with ties broken by insertion order (most recently added first).

**Validates: Requirements 7.2, 7.4, 7.5, 7.6**

---

### Property 14: Sort Does Not Mutate Storage

*For any* transaction list and any sort option applied, the order of transactions stored in `localStorage` SHALL remain in original insertion order regardless of the active display sort.

**Validates: Requirements 7.3**

---

### Property 15: Data Load Round-Trip

*For any* set of transactions serialised to `localStorage`, calling `init()` (simulating a page load) SHALL render all transactions in the transaction list with correct names, amounts, and categories.

**Validates: Requirements 8.3**

---

## Error Handling

### localStorage Errors

All `localStorage` read/write operations are wrapped in `try/catch` blocks:

```js
function saveTransactions() {
  try {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  } catch (e) {
    showStorageError('Save failed. Storage may be full or unavailable.');
    throw e; // re-throw so the caller can abort the state mutation
  }
}
```

On load, if `localStorage` is unavailable or returns invalid JSON:
- State initialises to defaults (empty transactions, null limit, light theme)
- A dismissible error banner is shown: "Unable to load saved data. Storage may be unavailable."
- The app remains fully functional for the current session

### Validation Errors

Validation errors are displayed inline next to the relevant field using `<span class="field-error">` elements. They are shown/hidden by toggling the `hidden` attribute. Error messages are cleared when the user modifies the corresponding field.

### Chart.js Unavailability

If Chart.js fails to load from CDN (e.g., offline), the chart canvas is hidden and a fallback message is shown. The rest of the app continues to function normally.

```js
function initChart() {
  if (typeof Chart === 'undefined') {
    document.getElementById('chart-section').innerHTML =
      '<p>Chart unavailable (Chart.js could not be loaded).</p>';
    return;
  }
  // ... normal chart init
}
```

### Edge Cases

| Scenario | Handling |
|---|---|
| Amount with more than 2 decimal places | Validator rejects with error message |
| Amount exactly 999999.99 | Accepted (boundary value) |
| Amount > 999999.99 | Rejected with error message |
| Item name with only whitespace | Validator trims and rejects as empty |
| Spending limit cleared (empty field) | Clears active limit, removes all highlights |
| All transactions deleted | Balance shows "0.00", chart shows empty message, list shows placeholder |
| localStorage quota exceeded | Caught, error shown, transaction not added |

---

## Testing Strategy

### Scope and Constraints

Per Requirement 11.2, **no test files are committed to the project**. All testing is done externally:
- Property-based tests run in a temporary Node.js scratch file (not committed)
- Manual/smoke tests run in the browser

### Unit Tests (Example-Based)

Focus on specific scenarios and edge cases:

| Test | Requirement |
|---|---|
| Form renders with correct fields and button | 1.1, 1.2 |
| Empty transaction list shows placeholder | 2.6 |
| Theme toggle applies correct CSS class | 5.2 |
| Storage failure on load shows banner | 8.6 |
| Sort control has exactly 3 named options | 7.1 |
| Spending limit input field exists | 6.1 |

### Property-Based Tests

Using **fast-check** (loaded via CDN or used in a temporary Node.js file):

Each property test runs a **minimum of 100 iterations** with randomly generated inputs.

Tag format: `// Feature: expense-budget-visualizer, Property {N}: {property_text}`

| Property | Generator Strategy |
|---|---|
| P1: Transaction add round-trip | `fc.record({ name: fc.string({minLength:1, maxLength:100}), amount: fc.float({min:0.01, max:999999.99}), category: fc.constantFrom('Food','Transport','Fun') })` |
| P2: Empty-field rejection | `fc.subarray(['name','amount','category'], {minLength:1})` — randomly omit fields |
| P3: Invalid amount rejection | `fc.oneof(fc.constant(0), fc.float({max:0}), fc.string())` |
| P4: Form reset after add | Same as P1 generator |
| P5: Storage failure | Any valid transaction + mocked localStorage.setItem throwing |
| P6: Balance invariant | `fc.array(transactionArbitrary, {minLength:0, maxLength:50})` |
| P7: Chart distribution | `fc.array(transactionArbitrary, {minLength:1, maxLength:50})` |
| P8: Delete round-trip | `fc.array(transactionArbitrary, {minLength:1}) + fc.nat()` (pick index) |
| P9: Theme round-trip | `fc.constantFrom('light','dark')` |
| P10: Spending limit persistence | `fc.float({min:0.01, max:999999.99})` |
| P11: Highlight correctness | `fc.array(transactionArbitrary) + fc.option(fc.float({min:0.01}))` |
| P12: Invalid limit rejection | `fc.oneof(fc.constant(0), fc.float({max:0}), fc.string())` |
| P13: Sort correctness | `fc.array(transactionArbitrary, {minLength:2}) + fc.constantFrom('amount-asc','amount-desc','category-az','default')` |
| P14: Sort storage immutability | Same as P13 |
| P15: Load round-trip | `fc.array(transactionArbitrary, {minLength:0, maxLength:20})` |

### Smoke / Manual Tests

| Test | Requirement |
|---|---|
| App loads from `file://` with all features working | 10.4 |
| No horizontal scroll at 320px viewport | 9.1 |
| All elements render correctly at 375px | 9.2 |
| Touch targets ≥ 44×44px | 9.3 |
| Chart scales to full width at <480px | 9.4 |
| Works in Chrome, Firefox, Edge, Safari | 10.1 |
| Exactly one HTML, one CSS, one JS file | 11.1 |
| No test files in project | 11.2 |
| Chart.js loaded via CDN script tag | 11.3 |
| Theme toggle reachable within 2 interactions | 5.1 |

### Testing Architecture Note

Because the project has no build tools and no test runner, the pure logic functions (`validateTransaction`, `validateSpendingLimit`, `getSortedTransactions`, `getCategoryTotals`, `calculateBalance`) should be written as standalone functions that can be imported/required in a temporary Node.js test file. The DOM-dependent rendering functions are tested manually or with a browser-based test harness.
