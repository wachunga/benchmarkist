'use strict';

const Big = require('big.js');
const debug = require('debug')('benchmarkist');
const formatter = require('../formatter');
const transactionApiClient = require('./transactionApiClient');

const transactionService = module.exports = {};

transactionService.downloadAllTransactions = function (options = {}) {
	return transactionApiClient.fetchAllTransactions().then(transactions => {
		let sortedTransactions = transactions.sort(sortByDateDescending);

		debug('fetched %d transactions', sortedTransactions.length);
		if (options.dedupe) {
			sortedTransactions = dedupeTransactions(sortedTransactions);
			debug('after dedupe: %d transactions', sortedTransactions.length);
		}

		let totalBalance = calculateTotalBalance(sortedTransactions);
		if (options.formatted) {
			totalBalance = formatter.formatCurrency(totalBalance);
			sortedTransactions = sortedTransactions.map(formatter.formatTransaction);
		}

		return {
			totalBalance,
			transactions: sortedTransactions
		};
	});
};

function sortByDateDescending(a, b) {
	return b.Date - a.Date;
}

function dedupeTransactions(transactions) {
	const seen = new Set();
	return transactions.filter(transaction => {
		// ideally, we would have a transaction id or at least timestamp to better dedupe
		const key = [transaction.Date, transaction.Company, transaction.Amount].join('-');
		if (seen.has(key)) {
			return false;
		}
		return seen.add(key);
	});
}

function calculateTotalBalance(transactions) {
	return transactions
		.map(transaction => transaction.Amount)
		.reduce((a, b) => a.plus(b), new Big(0))
		.toFixed(2);
}
