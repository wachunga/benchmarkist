'use strict';

const Big = require('big.js');
const formatter = require('./formatter');
const transactionService = require('./transactionService');

const expenseService = module.exports = {};

expenseService.listExpenseCategories = function (options = {}) {
	const transactionOptions = Object.assign({}, options, { formatted: false });
	return transactionService.downloadAllTransactions(transactionOptions).then(result => {
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

			const entry = categoryMap.get(transaction.Ledger);
			entry.total = entry.total.plus(transaction.Amount);
			entry.transactions.push(options.formatted ? formatter.formatTransaction(transaction) : transaction);
		});

		const sorted = Array.from(categoryMap.values()).sort(byTotal);
		return options.formatted ? sorted.map(formatTotal) : sorted;
	});
};

function byTotal(a, b) {
	return a.total.minus(b.total);
}

function formatTotal(category) {
	category.total = formatter.formatCurrency(category.total);
	return category;
}

