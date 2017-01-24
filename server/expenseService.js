'use strict';

const Big = require('big.js');
const formatter = require('./formatter');
const transactionService = require('./transactionService');

const expenseService = module.exports = {};

expenseService.listExpenseCategories = function (options = {}) {
	const transactionOptions = Object.assign({}, options, { formatted: false });
	return transactionService.downloadAllTransactions(transactionOptions).then(result => {
		let totalExpenses = new Big(0);
		const categoryMap = new Map();
		result.transactions.forEach(transaction => {
			if (!transaction.Ledger || transaction.Ledger === 'Income') {
				return;
			}

			if (!categoryMap.has(transaction.Ledger)) {
				categoryMap.set(transaction.Ledger, {
					categoryKey: transaction.Ledger,
					total: new Big(0),
					transactions: []
				});
			}
			totalExpenses = totalExpenses.plus(transaction.Amount);

			const entry = categoryMap.get(transaction.Ledger);
			entry.total = entry.total.plus(transaction.Amount);
			entry.transactions.push(options.formatted ? formatter.formatTransaction(transaction) : transaction);
		});

		const sorted = Array.from(categoryMap.values())
			.map(category => calculatePercent(category, totalExpenses))
			.sort(byTotal);
		return options.formatted ? sorted.map(formatResult) : sorted;
	});
};

function byTotal(a, b) {
	return a.total.minus(b.total);
}

function calculatePercent(category, totalExpenses) {
	category.percent = category.total.div(totalExpenses).toFixed(4);
	return category;
}

function formatResult(category) {
	category.total = formatter.formatCurrency(category.total);
	category.percent = formatter.formatPercentage(category.percent);
	return category;
}

