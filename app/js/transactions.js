(function () {

if (!fetch) {
	alert('Your browser is currently unsupported');
}

const transactionCountElement = document.querySelector('.transaction-count');
const transactionTableBodyElement = document.querySelector('.transaction-table-body');
const transactionTotalElement = document.querySelector('.transaction-table-total');

fetchTransactions().then(addResults);

function fetchTransactions() {
	return fetch('/a/1/transactions?formatted=true&dedupe=true').then(response => response.json());
}

function addResults(results) {
	transactionTotalElement.innerText = results.totalBalance;
	transactionCountElement.innerText = `(${results.transactions.length})`;
	transactionTableBodyElement.innerHTML = results.transactions.map(makeTransactionTableRow).join('\n');
}

function makeTransactionTableRow(result) {
	const rowClass = 'row-' + result.Ledger.toLowerCase();
	return `
<tr class="${rowClass}">
	<td>${result.Date}</td>
	<td>${result.Company}</td>
	<td>${result.Ledger}</td>
	<td>${result.Amount}</td>
</tr>`;
}

})();
