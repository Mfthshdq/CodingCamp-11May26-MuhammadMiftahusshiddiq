# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application built with HTML, CSS, and Vanilla JavaScript. It allows users to track personal expenses by adding transactions with a name, amount, and category. The app displays a running total balance, a scrollable transaction list with delete capability, and a live pie chart showing spending distribution by category. Additional features include dark/light mode toggle, a configurable spending limit highlight, and transaction sorting. All data is persisted in the browser's Local Storage — no backend or server is required.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an Item Name, Amount, and Category.
- **Item_Name**: A text label describing what was purchased or spent.
- **Amount**: A positive numeric value representing the cost of a transaction in the user's local currency.
- **Category**: A classification for a transaction; one of: Food, Transport, or Fun.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Balance**: The sum of all transaction amounts currently stored; displayed at the top of the App.
- **Chart**: A pie chart rendered via Chart.js that visualises spending distribution by Category.
- **Local_Storage**: The browser's Web Storage API used to persist transaction data client-side.
- **Spending_Limit**: A user-configurable numeric threshold; transactions whose Amount exceeds this value are visually highlighted.
- **Theme**: The visual colour scheme of the App; either Light Mode or Dark Mode.
- **Input_Form**: The UI form containing fields for Item_Name, Amount, and Category, plus a submit button.
- **Validator**: The client-side logic that checks Input_Form fields before a Transaction is added.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE App SHALL render an Input_Form containing a text field for Item_Name (maximum 100 characters), a numeric field for Amount, and a dropdown selector for Category (options: Food, Transport, Fun).
2. THE Input_Form SHALL include a submit button labelled "Add Transaction".
3. WHEN the user submits the Input_Form with all fields filled and a valid positive Amount (greater than 0, up to 2 decimal places, maximum value 999999.99), THE App SHALL add a new Transaction to the Transaction_List and persist it to Local_Storage.
4. WHEN the user submits the Input_Form with one or more empty fields, THE Validator SHALL display an inline error message identifying the missing field(s) and SHALL NOT add a Transaction.
5. WHEN the user submits the Input_Form with an Amount that is not a positive number (zero, negative, or non-numeric), THE Validator SHALL display an error message stating the Amount must be a positive number and SHALL NOT add a Transaction.
6. WHEN a Transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty/placeholder state.
7. IF Local_Storage throws an exception when saving a Transaction, THEN THE App SHALL display an inline error message indicating the save failed and SHALL NOT add the Transaction to the Transaction_List.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display every stored Transaction showing its Item_Name, Amount (formatted to 2 decimal places), and Category, with the most recently added Transaction appearing first.
2. THE Transaction_List SHALL be scrollable when the number of transactions exceeds the visible viewport height allocated to the list.
3. WHEN a new Transaction is added, THE Transaction_List SHALL update to include the new entry at the top within 500ms and without requiring a page reload.
4. WHEN the user clicks the delete button on a Transaction entry, THE App SHALL remove that Transaction from the Transaction_List and from Local_Storage within 500ms.
5. IF Local_Storage throws an exception when deleting a Transaction, THEN THE App SHALL display an inline error message indicating the deletion failed and SHALL NOT remove the Transaction from the Transaction_List.
6. WHEN the Transaction_List is empty, THE App SHALL display the placeholder message "No transactions yet."

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total balance at the top of the page so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the Balance in the topmost section of the page, above the Transaction_List, formatted as a number with exactly two decimal places (e.g., "0.00").
2. WHEN a Transaction is added, THE App SHALL recalculate and update the Balance to reflect the new total within 200ms.
3. WHEN a Transaction is deleted, THE App SHALL recalculate and update the Balance to reflect the reduced total within 200ms.
4. WHILE the Transaction_List is empty, THE App SHALL display a Balance of "0.00".
5. THE Balance SHALL equal the arithmetic sum of the Amount values of all Transactions currently in the Transaction_List.

---

### Requirement 4: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going.

#### Acceptance Criteria

1. WHEN the App loads or the Transaction_List changes, THE App SHALL render a Chart using Chart.js that displays each Category's share of total spending as a percentage of the grand total, rounded to one decimal place.
2. WHEN a Transaction is added or deleted, THE Chart SHALL update automatically to reflect the current spending distribution within 500ms and without requiring a page reload.
3. WHILE no Transactions exist for a given Category, THE Chart SHALL omit that Category's segment from the display.
4. WHILE the Transaction_List is empty, THE Chart SHALL display the text message "No spending data to display" in place of the chart segments.

---

### Requirement 5: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light mode so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle control that is reachable within 2 interactions from any screen state, to switch between Light Mode and Dark Mode.
2. WHEN the user activates the toggle, THE App SHALL apply the selected Theme to all UI elements (backgrounds, text, and icons) within 300ms and without a page reload.
3. THE App SHALL persist the user's Theme preference in Local_Storage.
4. WHEN the App loads, THE App SHALL restore the previously saved Theme preference from Local_Storage; IF no preference is stored, THE App SHALL default to Light Mode.
5. IF Local_Storage is unavailable when saving the Theme preference, THEN THE App SHALL apply the selected Theme for the current session only without attempting to persist it.

---

### Requirement 6: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit so that transactions exceeding that limit are visually highlighted and I can manage my budget.

#### Acceptance Criteria

1. THE App SHALL provide an input field where the user can enter a numeric Spending_Limit greater than 0 and up to 999999.99.
2. WHEN the user sets a valid Spending_Limit, THE App SHALL persist it in Local_Storage.
3. WHILE a Spending_Limit is set, THE Transaction_List SHALL apply a red left border (4px solid red) to every Transaction whose Amount strictly exceeds the Spending_Limit.
4. WHEN the Spending_Limit is updated, THE Transaction_List SHALL re-evaluate and update the highlight state of all existing Transactions within 300ms.
5. IF the user clears the Spending_Limit field, THEN THE App SHALL remove all highlights from the Transaction_List.
6. WHEN the user enters a non-numeric or non-positive value in the Spending_Limit field, THE Validator SHALL display an inline error message and SHALL NOT update the active Spending_Limit.

---

### Requirement 7: Transaction Sorting

**User Story:** As a user, I want to sort my transactions by amount or category so that I can quickly find and analyse my expenses.

#### Acceptance Criteria

1. THE App SHALL provide a sort control that exposes exactly three options: "Sort by Amount (Ascending)", "Sort by Amount (Descending)", and "Sort by Category (A–Z)".
2. WHEN the user selects a sort option, THE Transaction_List SHALL re-render in the selected order within 300ms.
3. THE App SHALL apply sorting to the display only; the underlying storage order in Local_Storage SHALL remain unchanged.
4. WHEN a new Transaction is added while a sort option is active, THE Transaction_List SHALL display the new Transaction in the position determined by the active sort option.
5. WHEN no sort option is selected, THE Transaction_List SHALL display Transactions in insertion order (most recently added first).
6. WHEN two Transactions have equal Amount values (for amount-based sorts) or equal Category values (for category-based sort), THE App SHALL break the tie by insertion order (most recently added first).

---

### Requirement 8: Data Persistence

**User Story:** As a user, I want my transactions and settings to be saved automatically so that my data is not lost when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added or deleted, THE App SHALL save the updated Transaction list to Local_Storage.
2. WHEN the Spending_Limit is updated, THE App SHALL save the new Spending_Limit value to Local_Storage.
3. WHEN the App loads, THE App SHALL read all Transactions from Local_Storage and render them in the Transaction_List.
4. WHEN the App loads, THE App SHALL read the Spending_Limit from Local_Storage and display it in the Spending_Limit input field and apply highlight rules to the Transaction_List.
5. WHEN the App loads and no Transaction data exists in Local_Storage (first visit or cleared storage), THE App SHALL initialise with an empty Transaction_List and display a Balance of "0.00".
6. IF Local_Storage is unavailable or returns a JSON parse error on load, THEN THE App SHALL initialise with an empty Transaction_List and display a dismissible banner message stating "Unable to load saved data. Storage may be unavailable."

---

### Requirement 9: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on both desktop and mobile devices so that I can track expenses on any device.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that adapts to screen widths from 320px to 1920px without horizontal scrolling or content overflow.
2. THE Input_Form, Transaction_List, Balance display, and Chart SHALL each render on screens with a width of 375px with a minimum font size of 14px, no clipped or overlapping content, and vertical scrolling permitted where content exceeds viewport height.
3. THE App SHALL use touch-friendly tap targets with a minimum size of 44×44 CSS pixels for all interactive controls.
4. WHEN the viewport width is less than 480px, THE Chart SHALL scale to the full container width without overflowing its container or causing horizontal scrolling.

---

### Requirement 10: Browser Compatibility

**User Story:** As a developer, I want the app to work across all major modern browsers so that users are not restricted to a single browser.

#### Acceptance Criteria

1. THE App SHALL, in the latest stable releases of Chrome, Firefox, Edge, and Safari, render the full UI, respond to all user interactions, produce no uncaught JavaScript errors, and exhibit no layout breakage or loss of functionality.
2. THE App SHALL use only standard Web APIs (DOM, Local_Storage) and SHALL NOT depend on browser-specific non-standard APIs.
3. IF the App requires network data fetching, THEN THE App SHALL use only the standard Fetch API.
4. THE App SHALL load completely from a local file system path (file:// protocol) with all features accessible and no network or server required.

---

### Requirement 11: Code Structure and File Organisation

**User Story:** As a developer, I want the codebase to follow a clean, minimal file structure so that the project is easy to maintain and extend.

#### Acceptance Criteria

1. THE App SHALL consist of exactly one HTML file located in the project root directory, exactly one CSS file located inside a `css/` directory, and exactly one JavaScript file located inside a `js/` directory, with no additional HTML, CSS, or JavaScript files present anywhere in the project.
2. THE App SHALL NOT include any test configuration files (e.g., vitest.config.js) or test files (e.g., app.test.js).
3. THE App SHALL load Chart.js via a static `<script>` tag referencing a CDN URL directly in the HTML file, and SHALL NOT require a build step or package manager.
