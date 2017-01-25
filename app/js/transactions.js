'use strict';

(function () {
	if (!window.fetch) {
		showError('Your browser is not supported. Please use an evergreen browser like Chrome or Firefox.');
		return;
	}

	const transactionCountElement = document.querySelector('.transaction-count');
	const transactionTableBodyElement = document.querySelector('.transaction-table-body');
	const transactionTotalElement = document.querySelector('.transaction-table-total');

	fetchTransactions().then(addResults).catch(err => {
		console.error(err);
		showError('Failed to fetch transactions');
	});

	function showError(message) {
		document.querySelector('.transaction-table-body td').innerText = message;
	}

	function fetchTransactions() {
		return window.fetch('/a/1/transactions?formatted=true&dedupe=true').then(response => {
			if (!response.ok) {
				throw new Error(`fetch failed with status ${response.status}: ${response.statusText}`);
			}
			return response.json();
		});
	}

	function addResults(results) {
		transactionTotalElement.innerText = results.totalBalance;
		transactionCountElement.innerText = `(${results.transactions.length})`;
		transactionTableBodyElement.innerHTML = results.transactions.map(makeTransactionTableRow).join('\n');
	}

	function makeTransactionTableRow(result) {
		const rowClass = `row-${result.Ledger.toLowerCase()}`;
		const link = `#category-${result.Ledger.toLowerCase().split(/\W/)[0]}`;
		return `
	<tr class="${rowClass}">
		<td>${result.Date}</td>
		<td>${result.Company}</td>
		<td><a href="${link}">${result.Ledger}</a></td>
		<td>${result.Amount}</td>
	</tr>`;
	}
}());
