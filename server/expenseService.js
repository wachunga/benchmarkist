'use strict';

const Big = require('big.js');
const formatter = require('./formatter');
const transactionService = require('./transactionService');
const benchmarkService = require('./benchmark/benchmarkService');

const expenseService = module.exports = {};

expenseService.listExpenseCategories = function (options = {}) {
	const transactionOptions = Object.assign({}, options, { formatted: false });
	return transactionService.downloadAllTransactions(transactionOptions).then(result => {
		let totalExpenses = new Big(0);
		const categoryMap = new Map();
		result.transactions.forEach(transaction => {
			const categoryKey = transaction.Ledger;
			if (!categoryKey || categoryKey === 'Income') {
				return;
			}

			if (!categoryMap.has(categoryKey)) {
				const initialEntry = {
					categoryKey,
					total: new Big(0),
					transactions: []
				};
				if (options.benchmark) {
					initialEntry.benchmark = benchmarkService.getExpenseBenchmark(categoryKey);
				}
				categoryMap.set(categoryKey, initialEntry);
			}
			totalExpenses = totalExpenses.plus(transaction.Amount);

			const entry = categoryMap.get(categoryKey);
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
	if (category.benchmark) {
		category.benchmark = formatter.formatPercentage(category.benchmark);
	}
	return category;
}

