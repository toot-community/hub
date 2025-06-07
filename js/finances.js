/**
 * Finances Page Handler
 * Fetches and displays financial data from the toot.community API
 */

class FinancesManager {
  constructor() {
    this.apiUrl = 'https://api.toot.community/finances';
    this.balanceElement = document.getElementById('current-balance');
    this.tableElement = document.getElementById('finances');
    
    this.init();
  }

  async init() {
    try {
      const data = await this.fetchFinancialData();
      this.renderBalance(data.current);
      this.renderMonthlyOverview(data);
      this.renderMetadata(data.metadata);
    } catch (error) {
      this.handleError(error);
    }
  }

  async fetchFinancialData() {
    const response = await fetch(this.apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  renderBalance(currentData) {
    if (this.balanceElement && currentData?.balance) {
      this.balanceElement.textContent = this.formatCurrency(currentData.balance);
    }
  }

  renderMonthlyOverview(data) {
    if (!this.tableElement || !data.months) return;

    this.setupTable();
    const tbody = this.createTableBody(data.months);
    this.tableElement.appendChild(tbody);
  }

  setupTable() {
    this.tableElement.innerHTML = '';
    this.ensureTableWrapper();
    
    const thead = this.createElement('thead', {
      innerHTML: `
        <tr>
          <th>Month</th>
          <th>Income</th>
          <th>Expenses</th>
          <th>Net Result</th>
          <th>Transactions</th>
          <th>Details</th>
        </tr>
      `
    });
    
    this.tableElement.appendChild(thead);
  }

  ensureTableWrapper() {
    if (!this.tableElement.parentElement.classList.contains('table-wrapper')) {
      const wrapper = this.createElement('div', { className: 'table-wrapper' });
      this.tableElement.parentElement.insertBefore(wrapper, this.tableElement);
      wrapper.appendChild(this.tableElement);
    }
  }

  createTableBody(monthsData) {
    const tbody = this.createElement('tbody');
    const sortedMonths = this.getSortedMonths(monthsData);

    sortedMonths.forEach(month => {
      const monthData = monthsData[month];
      const summaryRow = this.createMonthlySummaryRow(month, monthData);
      const transactionsRow = this.createTransactionsRow(monthData.transactions);
      
      this.addToggleHandler(summaryRow, transactionsRow);
      
      tbody.appendChild(summaryRow);
      tbody.appendChild(transactionsRow);
    });

    return tbody;
  }

  getSortedMonths(monthsData) {
    return Object.keys(monthsData).sort((a, b) => b.localeCompare(a));
  }

  createMonthlySummaryRow(month, monthData) {
    const { summary } = monthData;
    const monthName = this.formatMonthName(month);
    const netResultClass = summary.net_result >= 0 ? 'positive' : 'negative';

    return this.createElement('tr', {
      className: 'month-summary',
      style: 'cursor: pointer',
      innerHTML: `
        <td class="month-name">${monthName}</td>
        <td class="income">${this.formatCurrency(summary.total_income)}</td>
        <td class="expenses">${this.formatCurrency(Math.abs(summary.total_expenses))}</td>
        <td class="net-result ${netResultClass}">
          ${this.formatCurrency(summary.net_result)}
        </td>
        <td class="transaction-count">${summary.transaction_count}</td>
        <td class="details-arrow">▼</td>
      `
    });
  }

  createTransactionsRow(transactions) {
    const transactionsRow = this.createElement('tr', {
      className: 'transactions-row',
      style: 'display: none'
    });

    const transactionsCell = this.createElement('td', { colSpan: 6 });
    const transactionsTable = this.createTransactionsTable(transactions);
    
    transactionsCell.appendChild(transactionsTable);
    transactionsRow.appendChild(transactionsCell);
    
    return transactionsRow;
  }

  createTransactionsTable(transactions) {
    const table = this.createElement('table', {
      className: 'transactions-table',
      innerHTML: `
        <thead>
          <tr>
            <th>Date</th>
            <th>Payee</th>
            <th>Memo</th>
            <th>Amount</th>
          </tr>
        </thead>
      `
    });

    const tbody = this.createElement('tbody');
    const sortedTransactions = this.getSortedTransactions(transactions);

    sortedTransactions.forEach(transaction => {
      const row = this.createTransactionRow(transaction);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  }

  getSortedTransactions(transactions) {
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  createTransactionRow(transaction) {
    const { amount, date, payee_name, memo } = transaction;
    const isIncome = amount > 0;
    const amountClass = isIncome ? 'income' : 'expense';

    return this.createElement('tr', {
      innerHTML: `
        <td>${this.formatDate(date)}</td>
        <td>${this.escapeHtml(payee_name)}</td>
        <td>${this.escapeHtml(memo) || '-'}</td>
        <td class="${amountClass}">
          ${this.formatCurrency(Math.abs(amount))}
        </td>
      `
    });
  }

  addToggleHandler(summaryRow, transactionsRow) {
    summaryRow.addEventListener('click', () => {
      const isVisible = transactionsRow.style.display !== 'none';
      const newDisplay = isVisible ? 'none' : 'table-row';
      
      transactionsRow.style.display = newDisplay;
      summaryRow.classList.toggle('expanded', !isVisible);
      
      const arrow = summaryRow.querySelector('.details-arrow');
      if (arrow) {
        arrow.textContent = isVisible ? '▼' : '▲';
      }
    });
  }

  renderMetadata(metadata) {
    if (!metadata || !this.tableElement) return;

    const metadataDiv = this.createElement('div', {
      className: 'metadata',
      innerHTML: `
        <small>
          Generated: ${this.formatDateTime(metadata.generated_at)}
        </small>
      `
    });

    this.tableElement.parentElement.appendChild(metadataDiv);
  }

  // Utility methods
  createElement(tagName, properties = {}) {
    const element = document.createElement(tagName);
    Object.assign(element, properties);
    return element;
  }

  formatCurrency(amount) {
    return `€${Number(amount).toFixed(2)}`;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
  }

  formatMonthName(monthString) {
    const [year, monthNum] = monthString.split('-');
    return new Date(year, monthNum - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  handleError(error) {
    console.error('Error fetching finances:', error);
    
    if (this.balanceElement) {
      this.balanceElement.textContent = 'Error loading';
    }
    
    // Could add user-friendly error message here
    console.warn('Failed to load financial data. Please try again later.');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FinancesManager();
});