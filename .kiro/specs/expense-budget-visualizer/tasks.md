# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a zero-dependency, client-side web application in three files (`index.html`, `css/style.css`, `js/app.js`). The build follows the State → Render loop described in the design: every mutation writes to `localStorage` then calls `render()` to synchronise the UI. Chart.js is loaded via CDN. No build tools or package manager are used.

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - Create `index.html` in the project root with the full HTML structure defined in the design (header, balance section, error banner, form section, spending-limit section, sort section, transaction-list section, chart section)
  - Add the Chart.js CDN `<script>` tag and the `<script src="js/app.js">` tag at the bottom of `<body>`
  - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - Create `css/style.css` and `js/app.js` as empty placeholder files to confirm the file structure
  - _Requirements: 11.1, 11.3, 10.4_

- [x] 2. Implement CSS styling, theming, and responsive layout
  - [x] 2.1 Write base styles and CSS custom properties for light and dark themes
    - Define all `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--border-color`, `--accent-color`, `--error-color`, `--highlight-border` variables on `:root`
    - Override variables on `body.dark` for dark mode
    - Apply variables to all sections, inputs, buttons, and text elements
    - _Requirements: 5.2, 9.1, 9.2_
  - [x] 2.2 Implement responsive layout and touch targets
    - Use mobile-first single-column layout; add `@media (min-width: 480px)` breakpoint for wider screens
    - Ensure all `<button>` and `<select>` elements have `min-height: 44px; min-width: 44px`
    - Ensure chart canvas fills container width on narrow viewports and is constrained on wider ones
    - Add `.transaction-item.over-limit { border-left: 4px solid var(--error-color); }` rule
    - Add `.field-error` style for inline validation messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 6.3_

- [x] 3. Implement core JavaScript: constants, state, and localStorage utilities
  - [x] 3.1 Write the IIFE wrapper, constants, and state object
    - Wrap all code in an IIFE to avoid global scope pollution
    - Define `KEYS` constant (`ebv_transactions`, `ebv_spending_limit`, `ebv_theme`)
    - Define `CATEGORIES` array and `SORT_OPTIONS` object
    - Define the `state` object with `transactions`, `spendingLimit`, `theme`, `sortOption` fields
    - _Requirements: 8.1, 8.2, 8.3, 11.1_
  - [x] 3.2 Implement `loadState()`, `saveTransactions()`, `saveSpendingLimit()`, and `saveTheme()`
    - Wrap all `localStorage` reads in `try/catch`; return defaults on error and show the dismissible error banner
    - Wrap all `localStorage` writes in `try/catch`; re-throw so callers can abort state mutations
    - Parse JSON for transactions and spending limit; read theme as a plain string
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 1.7, 2.5, 5.5_
  - [ ]* 3.3 Write property test for storage round-trip (Property 15)
    - **Property 15: Data Load Round-Trip**
    - **Validates: Requirements 8.3**

- [x] 4. Implement validation logic
  - [x] 4.1 Implement `validateTransaction(name, amountStr, category)`
    - Trim name; reject if empty or > 100 chars
    - Parse amount as float; reject if non-numeric, ≤ 0, > 999999.99, or more than 2 decimal places
    - Reject category if not in `['Food', 'Transport', 'Fun']`
    - Return `{ valid, errors: { name?, amount?, category? } }`
    - _Requirements: 1.4, 1.5_
  - [ ]* 4.2 Write property test for empty-field validation (Property 2)
    - **Property 2: Empty-Field Validation Rejects Submission**
    - **Validates: Requirements 1.4**
  - [ ]* 4.3 Write property test for invalid amount validation (Property 3)
    - **Property 3: Invalid Amount Validation Rejects Submission**
    - **Validates: Requirements 1.5**
  - [x] 4.4 Implement `validateSpendingLimit(valueStr)`
    - Parse as float; reject if non-numeric, ≤ 0, or > 999999.99
    - Return `{ valid, error? }`
    - _Requirements: 6.6_
  - [ ]* 4.5 Write property test for invalid spending limit rejection (Property 12)
    - **Property 12: Invalid Spending Limit Rejected**
    - **Validates: Requirements 6.6**

- [x] 5. Implement state mutation functions
  - [x] 5.1 Implement `addTransaction(name, amount, category)`
    - Generate a unique `id` via `crypto.randomUUID()` with `Date.now()` fallback
    - Capture `timestamp` as `Date.now()`
    - Call `saveTransactions()`; on throw, show inline storage error and abort
    - On success, push to `state.transactions` and call `render()`
    - _Requirements: 1.3, 1.7, 2.3, 8.1_
  - [ ]* 5.2 Write property test for transaction add round-trip (Property 1)
    - **Property 1: Transaction Add Round-Trip**
    - **Validates: Requirements 1.3, 2.1, 2.3**
  - [ ]* 5.3 Write property test for storage failure leaves state unchanged (Property 5)
    - **Property 5: Storage Failure Leaves State Unchanged**
    - **Validates: Requirements 1.7, 2.5**
  - [x] 5.4 Implement `deleteTransaction(id)`
    - Filter `state.transactions` by id; call `saveTransactions()`; on throw, show error and abort
    - On success, update `state.transactions` and call `render()`
    - _Requirements: 2.4, 2.5, 8.1_
  - [ ]* 5.5 Write property test for transaction delete round-trip (Property 8)
    - **Property 8: Transaction Delete Round-Trip**
    - **Validates: Requirements 2.4**
  - [x] 5.6 Implement `setSpendingLimit(value)` and `clearSpendingLimit()`
    - `setSpendingLimit`: set `state.spendingLimit`, call `saveSpendingLimit()`, call `render()`
    - `clearSpendingLimit`: set `state.spendingLimit = null`, call `saveSpendingLimit()`, call `render()`
    - _Requirements: 6.2, 6.4, 6.5, 8.2_
  - [ ]* 5.7 Write property test for spending limit persistence (Property 10)
    - **Property 10: Spending Limit Persistence**
    - **Validates: Requirements 6.2**
  - [x] 5.8 Implement `setTheme(theme)` and `setSort(option)`
    - `setTheme`: toggle `body.dark` class, update `state.theme`, call `saveTheme()`, update toggle button icon
    - `setSort`: update `state.sortOption`, call `render()`
    - _Requirements: 5.2, 5.3, 7.2_
  - [ ]* 5.9 Write property test for theme persistence round-trip (Property 9)
    - **Property 9: Theme Persistence Round-Trip**
    - **Validates: Requirements 5.3, 5.4**

- [x] 6. Checkpoint — Ensure all logic functions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement rendering functions
  - [x] 7.1 Implement `renderBalance()`
    - Sum all `state.transactions` amounts; format to exactly 2 decimal places
    - Update `#balance-display` text content
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 7.2 Write property test for balance invariant (Property 6)
    - **Property 6: Balance Equals Sum of All Transaction Amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - [x] 7.3 Implement `getSortedTransactions(transactions, sortOption)` and `renderList()`
    - Implement the four sort cases with timestamp tie-breaking as specified in the design
    - `renderList`: clear `#transaction-list`; for each sorted transaction, create an `<li>` with name, formatted amount, category, and a delete button; apply `.over-limit` class when `amount > state.spendingLimit`; toggle `#empty-message` visibility
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 6.3, 6.4, 6.5, 7.2, 7.4, 7.5, 7.6_
  - [ ]* 7.4 Write property test for sort correctness (Property 13)
    - **Property 13: Sort Correctness**
    - **Validates: Requirements 7.2, 7.4, 7.5, 7.6**
  - [ ]* 7.5 Write property test for sort storage immutability (Property 14)
    - **Property 14: Sort Does Not Mutate Storage**
    - **Validates: Requirements 7.3**
  - [ ]* 7.6 Write property test for spending limit highlight correctness (Property 11)
    - **Property 11: Spending Limit Highlight Correctness**
    - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 8. Implement Chart.js integration
  - [x] 8.1 Implement `getCategoryTotals(transactions)` and `initChart()`
    - `getCategoryTotals`: reduce transactions to `{ Food, Transport, Fun }` totals, omitting categories with total ≤ 0
    - `initChart`: guard against `Chart === undefined` (CDN failure); create a pie chart on `#spending-chart`; store instance in a module-level variable; show `#chart-empty-message` when no data
    - _Requirements: 4.1, 4.4_
  - [ ]* 8.2 Write property test for chart data distribution (Property 7)
    - **Property 7: Chart Data Reflects Current Category Distribution**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 8.3 Implement `updateChart()`
    - Update `chart.data.labels` and `chart.data.datasets[0].data` from `getCategoryTotals()`
    - Call `chart.update()`; toggle `#chart-empty-message` based on whether any data exists
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 9. Implement `render()`, `bindEvents()`, and `init()`
  - [x] 9.1 Implement the top-level `render()` function
    - Call `renderBalance()`, `renderList()`, and `updateChart()` in sequence
    - _Requirements: 2.3, 3.2, 4.2_
  - [x] 9.2 Implement `bindEvents()`
    - Attach `submit` listener on `#transaction-form`: run `validateTransaction`, show/clear inline errors, call `addTransaction` on success, reset form fields (Requirement 1.6)
    - Attach `click` listener on `#transaction-list` (event delegation) for delete buttons: call `deleteTransaction(id)`
    - Attach `click` listener on `#set-limit-btn`: run `validateSpendingLimit`, show/clear inline error, call `setSpendingLimit` or `clearSpendingLimit`
    - Attach `change` listener on `#sort-select`: call `setSort`
    - Attach `click` listener on `#theme-toggle`: call `setTheme` with toggled value
    - Attach `click` listener on `#dismiss-banner`: hide `#error-banner`
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.4, 5.1, 5.2, 6.4, 6.5, 6.6, 7.2_
  - [ ]* 9.3 Write property test for form reset after successful add (Property 4)
    - **Property 4: Form Resets After Successful Add**
    - **Validates: Requirements 1.6**
  - [x] 9.4 Implement `init()`
    - Call `loadState()` to populate `state` from `localStorage`
    - Apply saved theme class to `<body>` and restore spending-limit field value
    - Call `initChart()` then `render()`
    - Call `bindEvents()`
    - Register `init` on `DOMContentLoaded`
    - _Requirements: 5.4, 8.3, 8.4, 8.5, 8.6_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Per Requirement 11.2, no test files are committed to the project; property-based tests run in a temporary Node.js scratch file using `fast-check`
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1", "4.4"] },
    { "id": 3, "tasks": ["3.3", "4.2", "4.3", "4.5", "5.1", "5.4", "5.6", "5.8"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.5", "5.7", "5.9", "7.1", "7.3", "8.1"] },
    { "id": 5, "tasks": ["7.2", "7.4", "7.5", "7.6", "8.2", "8.3"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3", "9.4"] },
    { "id": 8, "tasks": ["6", "10"] }
  ]
}
```
