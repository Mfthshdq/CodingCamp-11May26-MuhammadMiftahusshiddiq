(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  const KEYS = {
    TRANSACTIONS: 'ebv_transactions',
    SPENDING_LIMIT: 'ebv_spending_limit',
    THEME: 'ebv_theme',
    CATEGORIES: 'ebv_categories'
  };

  const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

  const SORT_OPTIONS = {
    DEFAULT: 'default',
    AMOUNT_ASC: 'amount-asc',
    AMOUNT_DESC: 'amount-desc',
    CATEGORY_AZ: 'category-az'
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    transactions: [],      // Transaction[]
    spendingLimit: null,   // number | null
    theme: 'light',        // 'light' | 'dark'
    sortOption: 'default', // SortOption
    customCategories: []   // string[] — user-defined categories
  };

  // Returns the full merged category list (defaults + custom)
  function allCategories() {
    return DEFAULT_CATEGORIES.concat(state.customCategories);
  }

  // ── Storage ────────────────────────────────────────────────────────────────

  function showErrorBanner(message) {
    const banner = document.getElementById('error-banner');
    if (banner) {
      // Update text node (first child) while keeping the dismiss button
      const textNode = banner.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = message + ' ';
      } else {
        banner.insertBefore(document.createTextNode(message + ' '), banner.firstChild);
      }
      banner.removeAttribute('hidden');
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEYS.TRANSACTIONS);
      state.transactions = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.transactions = [];
      showErrorBanner('Unable to load saved data. Storage may be unavailable.');
    }

    try {
      const raw = localStorage.getItem(KEYS.SPENDING_LIMIT);
      state.spendingLimit = raw ? JSON.parse(raw) : null;
    } catch (e) {
      state.spendingLimit = null;
    }

    try {
      const raw = localStorage.getItem(KEYS.THEME);
      state.theme = (raw === 'dark') ? 'dark' : 'light';
    } catch (e) {
      state.theme = 'light';
    }

    try {
      const raw = localStorage.getItem(KEYS.CATEGORIES);
      state.customCategories = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.customCategories = [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    } catch (e) {
      showStorageError('Save failed. Storage may be full or unavailable.');
      throw e;
    }
  }

  function saveSpendingLimit() {
    try {
      localStorage.setItem(KEYS.SPENDING_LIMIT, JSON.stringify(state.spendingLimit));
    } catch (e) {
      showStorageError('Save failed. Storage may be full or unavailable.');
      throw e;
    }
  }

  function saveTheme() {
    try {
      localStorage.setItem(KEYS.THEME, state.theme);
    } catch (e) {
      // Per Req 5.5: apply theme for current session only, do not re-throw
    }
  }

  function saveCategories() {
    try {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(state.customCategories));
    } catch (e) {
      showStorageError('Save failed. Storage may be full or unavailable.');
      throw e;
    }
  }

  function showStorageError(message) {
    const el = document.getElementById('storage-error');
    if (el) {
      el.textContent = message;
      el.removeAttribute('hidden');
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateTransaction(name, amountStr, category) {
    const errors = {};
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      errors.name = 'Item name is required.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Item name must be 100 characters or fewer.';
    }

    const amount = parseFloat(amountStr);
    if (amountStr === '' || amountStr === null || amountStr === undefined || isNaN(amount)) {
      errors.amount = 'Amount must be a positive number.';
    } else if (amount <= 0) {
      errors.amount = 'Amount must be a positive number.';
    } else if (amount > 999999.99) {
      errors.amount = 'Amount must not exceed 999999.99.';
    } else {
      // Check max 2 decimal places
      const decimalPart = amountStr.toString().split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        errors.amount = 'Amount must have at most 2 decimal places.';
      }
    }

    if (!category || !allCategories().includes(category)) {
      errors.category = 'Please select a category.';
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  function validateSpendingLimit(valueStr) {
    const value = parseFloat(valueStr);
    if (valueStr === '' || valueStr === null || valueStr === undefined || isNaN(value)) {
      return { valid: false, error: 'Spending limit must be a positive number.' };
    }
    if (value <= 0) {
      return { valid: false, error: 'Spending limit must be a positive number.' };
    }
    if (value > 999999.99) {
      return { valid: false, error: 'Spending limit must not exceed 999999.99.' };
    }
    return { valid: true };
  }

  // ── State Mutations ────────────────────────────────────────────────────────

  function addTransaction(name, amount, category) {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(36).slice(2);
    const transaction = {
      id,
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      timestamp: Date.now()
    };
    // Attempt to save first; abort if storage throws
    const previous = state.transactions.slice();
    state.transactions.push(transaction);
    try {
      saveTransactions();
    } catch (e) {
      state.transactions = previous;
      return false;
    }
    render();
    return true;
  }

  function deleteTransaction(id) {
    const previous = state.transactions.slice();
    state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
    try {
      saveTransactions();
    } catch (e) {
      state.transactions = previous;
      return;
    }
    render();
  }

  function setSpendingLimit(value) {
    const previous = state.spendingLimit;
    state.spendingLimit = parseFloat(value);
    try {
      saveSpendingLimit();
    } catch (e) {
      state.spendingLimit = previous;
      return;
    }
    render();
  }

  function clearSpendingLimit() {
    const previous = state.spendingLimit;
    state.spendingLimit = null;
    try {
      saveSpendingLimit();
    } catch (e) {
      state.spendingLimit = previous;
      return;
    }
    render();
  }

  function setTheme(theme) {
    state.theme = theme;
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    saveTheme();
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function setSort(option) {
    state.sortOption = option;
    render();
  }

  // ── Category Management ────────────────────────────────────────────────────

  function addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError('new-category-error', 'Category name is required.');
      return false;
    }
    if (trimmed.length > 50) {
      setFieldError('new-category-error', 'Category name must be 50 characters or fewer.');
      return false;
    }
    if (allCategories().some(function (c) { return c.toLowerCase() === trimmed.toLowerCase(); })) {
      setFieldError('new-category-error', 'That category already exists.');
      return false;
    }
    const previous = state.customCategories.slice();
    state.customCategories.push(trimmed);
    try {
      saveCategories();
    } catch (e) {
      state.customCategories = previous;
      return false;
    }
    setFieldError('new-category-error', null);
    renderCategoryOptions();
    renderCategoryTags();
    return true;
  }

  function deleteCategory(name) {
    // Prevent deleting a category that is in use
    var inUse = state.transactions.some(function (t) { return t.category === name; });
    if (inUse) {
      setFieldError('new-category-error', '"' + escapeHtml(name) + '" is used by existing transactions and cannot be deleted.');
      return;
    }
    const previous = state.customCategories.slice();
    state.customCategories = state.customCategories.filter(function (c) { return c !== name; });
    try {
      saveCategories();
    } catch (e) {
      state.customCategories = previous;
      return;
    }
    setFieldError('new-category-error', null);
    renderCategoryOptions();
    renderCategoryTags();
  }

  function renderCategoryOptions() {
    var select = document.getElementById('category');
    if (!select) return;
    var current = select.value;
    select.innerHTML = '<option value="">Select category</option>';
    allCategories().forEach(function (cat) {
      var opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
    // Restore selection if still valid
    if (current && allCategories().includes(current)) {
      select.value = current;
    }
  }

  function renderCategoryTags() {
    var container = document.getElementById('category-tags');
    if (!container) return;
    container.innerHTML = '';

    // Default categories — shown as plain non-deletable tags
    DEFAULT_CATEGORIES.forEach(function (cat) {
      var tag = document.createElement('span');
      tag.className = 'category-tag category-tag--default';
      tag.textContent = cat;
      container.appendChild(tag);
    });

    // Custom categories — shown with a delete button
    state.customCategories.forEach(function (cat) {
      var tag = document.createElement('span');
      tag.className = 'category-tag category-tag--custom';

      var label = document.createElement('span');
      label.textContent = cat;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-tag__delete';
      btn.setAttribute('aria-label', 'Delete category ' + cat);
      btn.textContent = '✕';
      btn.dataset.category = cat;

      tag.appendChild(label);
      tag.appendChild(btn);
      container.appendChild(tag);
    });
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function renderBalance() {
    const total = state.transactions.reduce(function (sum, t) {
      return sum + t.amount;
    }, 0);
    const el = document.getElementById('balance-display');
    if (el) {
      el.textContent = total.toFixed(2);
    }
  }

  function getSortedTransactions(transactions, sortOption) {
    const copy = transactions.slice();
    switch (sortOption) {
      case SORT_OPTIONS.AMOUNT_ASC:
        return copy.sort(function (a, b) {
          return (a.amount - b.amount) || (b.timestamp - a.timestamp);
        });
      case SORT_OPTIONS.AMOUNT_DESC:
        return copy.sort(function (a, b) {
          return (b.amount - a.amount) || (b.timestamp - a.timestamp);
        });
      case SORT_OPTIONS.CATEGORY_AZ:
        return copy.sort(function (a, b) {
          return a.category.localeCompare(b.category) || (b.timestamp - a.timestamp);
        });
      default: // 'default' — newest first
        return copy.sort(function (a, b) {
          return b.timestamp - a.timestamp;
        });
    }
  }

  function renderList() {
    const list = document.getElementById('transaction-list');
    const emptyMsg = document.getElementById('empty-message');
    if (!list) return;

    // Clear existing items
    list.innerHTML = '';

    const sorted = getSortedTransactions(state.transactions, state.sortOption);

    if (sorted.length === 0) {
      if (emptyMsg) emptyMsg.removeAttribute('hidden');
      return;
    }

    if (emptyMsg) emptyMsg.setAttribute('hidden', '');

    sorted.forEach(function (t) {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.dataset.id = t.id;

      // Apply over-limit highlight
      if (state.spendingLimit !== null && t.amount > state.spendingLimit) {
        li.classList.add('over-limit');
      }

      li.innerHTML =
        '<span class="t-name">' + escapeHtml(t.name) + '</span>' +
        '<span class="t-amount">' + t.amount.toFixed(2) + '</span>' +
        '<span class="t-category">' + escapeHtml(t.category) + '</span>' +
        '<button class="delete-btn" data-id="' + t.id + '" aria-label="Delete ' + escapeHtml(t.name) + '">✕</button>';

      list.appendChild(li);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Chart ──────────────────────────────────────────────────────────────────

  var chartInstance = null;

  function getCategoryTotals(transactions) {
    return transactions.reduce(function (acc, t) {
      if (t.amount > 0) {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {});
  }

  function initChart() {
    if (typeof Chart === 'undefined') {
      var section = document.getElementById('chart-section');
      if (section) {
        section.innerHTML = '<p>Chart unavailable (Chart.js could not be loaded).</p>';
      }
      return;
    }

    var canvas = document.getElementById('spending-chart');
    var emptyMsg = document.getElementById('chart-empty-message');
    if (!canvas) return;

    var totals = getCategoryTotals(state.transactions);
    var labels = Object.keys(totals);
    var data = labels.map(function (k) { return totals[k]; });

    if (labels.length === 0) {
      canvas.setAttribute('hidden', '');
      if (emptyMsg) emptyMsg.removeAttribute('hidden');
    } else {
      canvas.removeAttribute('hidden');
      if (emptyMsg) emptyMsg.setAttribute('hidden', '');
    }

    chartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#4a90e2', '#e53935', '#43a047', '#fb8c00', '#8e24aa']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                var total = context.dataset.data.reduce(function (s, v) { return s + v; }, 0);
                var pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                return context.label + ': ' + pct + '%';
              }
            }
          }
        }
      }
    });
  }

  function updateChart() {
    if (!chartInstance) return;

    var totals = getCategoryTotals(state.transactions);
    var labels = Object.keys(totals);
    var data = labels.map(function (k) { return totals[k]; });

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.update();

    var canvas = document.getElementById('spending-chart');
    var emptyMsg = document.getElementById('chart-empty-message');
    if (labels.length === 0) {
      if (canvas) canvas.setAttribute('hidden', '');
      if (emptyMsg) emptyMsg.removeAttribute('hidden');
    } else {
      if (canvas) canvas.removeAttribute('hidden');
      if (emptyMsg) emptyMsg.setAttribute('hidden', '');
    }
  }

  // ── Top-level Render ───────────────────────────────────────────────────────

  function render() {
    renderBalance();
    renderList();
    updateChart();
  }

  // ── Event Wiring ───────────────────────────────────────────────────────────

  function bindEvents() {
    // Transaction form submit
    var form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameEl = document.getElementById('item-name');
        var amountEl = document.getElementById('amount');
        var categoryEl = document.getElementById('category');

        var name = nameEl ? nameEl.value : '';
        var amountStr = amountEl ? amountEl.value : '';
        var category = categoryEl ? categoryEl.value : '';

        var result = validateTransaction(name, amountStr, category);

        // Clear previous errors
        setFieldError('item-name-error', null);
        setFieldError('amount-error', null);
        setFieldError('category-error', null);
        setFieldError('storage-error', null);

        if (!result.valid) {
          if (result.errors.name) setFieldError('item-name-error', result.errors.name);
          if (result.errors.amount) setFieldError('amount-error', result.errors.amount);
          if (result.errors.category) setFieldError('category-error', result.errors.category);
          return;
        }

        addTransaction(name, parseFloat(amountStr), category);
        form.reset();
      });
    }

    // Delete transaction — event delegation on the list
    var list = document.getElementById('transaction-list');
    if (list) {
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('.delete-btn');
        if (btn) {
          var id = btn.dataset.id;
          if (id) deleteTransaction(id);
        }
      });
    }

    // Set spending limit
    var setLimitBtn = document.getElementById('set-limit-btn');
    if (setLimitBtn) {
      setLimitBtn.addEventListener('click', function () {
        var limitEl = document.getElementById('spending-limit');
        var valueStr = limitEl ? limitEl.value : '';

        setFieldError('limit-error', null);

        if (valueStr === '' || valueStr === null) {
          clearSpendingLimit();
          return;
        }

        var result = validateSpendingLimit(valueStr);
        if (!result.valid) {
          setFieldError('limit-error', result.error);
          return;
        }

        setSpendingLimit(parseFloat(valueStr));
      });
    }

    // Sort select
    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        setSort(sortSelect.value);
      });
    }

    // Theme toggle
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var newTheme = state.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      });
    }

    // Dismiss error banner
    var dismissBtn = document.getElementById('dismiss-banner');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        var banner = document.getElementById('error-banner');
        if (banner) banner.setAttribute('hidden', '');
      });
    }

    // Add custom category
    var addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', function () {
        var input = document.getElementById('new-category');
        if (!input) return;
        var added = addCategory(input.value);
        if (added) input.value = '';
      });
    }

    // Allow pressing Enter in the new-category input
    var newCategoryInput = document.getElementById('new-category');
    if (newCategoryInput) {
      newCategoryInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var added = addCategory(newCategoryInput.value);
          if (added) newCategoryInput.value = '';
        }
      });
    }

    // Delete custom category — event delegation on the tags container
    var tagsContainer = document.getElementById('category-tags');
    if (tagsContainer) {
      tagsContainer.addEventListener('click', function (e) {
        var btn = e.target.closest('.category-tag__delete');
        if (btn && btn.dataset.category) {
          deleteCategory(btn.dataset.category);
        }
      });
    }
  }

  function setFieldError(elementId, message) {
    var el = document.getElementById(elementId);
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.removeAttribute('hidden');
    } else {
      el.textContent = '';
      el.setAttribute('hidden', '');
    }
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  function init() {
    loadState();

    // Apply saved theme
    if (state.theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Update theme toggle icon
    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }

    // Restore spending limit field value
    var limitEl = document.getElementById('spending-limit');
    if (limitEl && state.spendingLimit !== null) {
      limitEl.value = state.spendingLimit;
    }

    initChart();
    renderCategoryOptions();
    renderCategoryTags();
    render();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
