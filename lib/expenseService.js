'use strict';

const Big = require('big.js');
const transactionService = require('./transactionService');

const expenseService = module.exports = {};

expenseService.listExpenseCategories = function (options) {
	return transactionService.downloadAllTransactions(options).then(transactions => {
		const categoryMap = {};
		transactions.forEach(transaction => {
			if (!transaction.Ledger) {
				// eg exclude income
				return;
			}

			if (!categoryMap[transaction.Ledger]) {
				categoryMap[transaction.Ledger] = {
					categoryKey: transaction.Ledger,
					total: new Big(0),
					transactions: []
				};
			}

			const entry = categoryMap[transaction.Ledger];
			entry.transactions.push(transaction);
			entry.total = entry.total.plus(transaction.Amount);
		});
		return Object.keys(categoryMap).map(key => categoryMap[key]).sort(byTotal);
	});
};

function byTotal(a, b) {
	return a.total - b.total;
}
