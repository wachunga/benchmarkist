'use strict';

(function () {
	if (!window.fetch) {
		showError('Your browser is not supported. Please use an evergreen browser like Chrome or Firefox.');
		return;
	}

	const expensesSummaryElement = document.querySelector('.expenses-table-body');

	fetchExpenses().then(showExpenses).catch(err => {
		console.error(err);
		showError('Failed to fetch expenses');
	});

	function showError(message) {
		document.querySelector('.expenses-table-body td').innerText = message;
	}

	function fetchExpenses() {
		return window.fetch('/a/1/expenses?formatted=true&dedupe=true&benchmark=true').then(response => {
			if (!response.ok) {
				throw new Error(`fetch failed with status ${response.status}: ${response.statusText}`);
			}
			return response.json();
		});
	}

	function showExpenses(results) {
		expensesSummaryElement.innerHTML = results.map(buildExpenseEntry).join('\n');
	}

	const flagIcon = '&#x1f914; '; // thinking face
	const flagMessage = 'This expense is much higher than the benchmark. Why is that?';

	function buildExpenseEntry(expense) {
		const detailsTableRows = expense.transactions.map(transaction => {
			return `<tr><td>${transaction.Date}</td><td>${transaction.Company}</td><td>${transaction.Amount}</td></tr>`;
		}).join('\n');
		const detailsTable = `<table class="expense-details-table"><tbody>${detailsTableRows}</tbody></table>`;
		const detailsElement = `<details><summary>${expense.categoryKey}</summary>${detailsTable}</details>`;

		const categoryId = `category-${expense.categoryKey.toLowerCase().split(/\W/)[0]}`;
		const maybeFlaggedPercent = seemsHigh(expense) ?
			`<span class="help" title="${flagMessage}">${flagIcon} ${expense.percent}</span>` :
			expense.percent;
		return `<tr id="${categoryId}"><td>${detailsElement}</td><td>${expense.total}</td><td>${maybeFlaggedPercent}</td><td>${expense.benchmark}</td></tr>`;
	}

	function seemsHigh(expense) {
		const percent = parseFloat(expense.percent);
		const benchmark = parseFloat(expense.benchmark);
		const absoluteDiff = percent - benchmark;
		const percentDiff = absoluteDiff / benchmark;
		return absoluteDiff >= 2 && percentDiff > 0.2;
	}
}());
