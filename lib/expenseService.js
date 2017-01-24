'use strict';

const Big = require('big.js');
const numeral = require('numeral');
const transactionService = require('./transactionService');

const expenseService = module.exports = {};

expenseService.listExpenseCategories = function (options) {
	const transactionOptions = Object.assign({}, options, { formatted: false });
	return transactionService.downloadAllTransactions(transactionOptions).then(result => {
		const categoryMap = {};
		result.transactions.forEach(transaction => {
			if (!transaction.Ledger || transaction.Ledger === 'Income') {
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
			entry.total = entry.total.plus(transaction.Amount);
			// TODO: extract formatter.transaction and use that here before pushing
			entry.transactions.push(transaction);
		});

		return Object.keys(categoryMap)
			.map(key => categoryMap[key])
			.sort(byTotal)
			.map(formatTotal); // TODO: control with options.formatted
	});
};

function byTotal(a, b) {
	return a.total.minus(b.total);
}

function formatTotal(category) {
	category.total = formatCurrency(category.total);
	return category;
}

const asCurrencyWithThousandsSeparator = '($0,0[.]00)';

function formatCurrency(amount) {
	return numeral(amount).format(asCurrencyWithThousandsSeparator);
}

