'use strict';

const Big = require('big.js');
const transactionApiClient = require('./transactionApiClient');

const transactionService = module.exports = {};

transactionService.calculateTotalBalance = function () {
	return transactionService.downloadAllTransactions().then(transactions => {
		return transactions
			.map(transaction => transaction.Amount)
			.reduce((a, b) => a.plus(b), new Big(0))
			.toFixed(2);
	});
};

transactionService.downloadAllTransactions = function (options = {}) {
	return transactionApiClient.fetchAllTransactions().then(transactions => {
		let sortedTransactions = transactions.sort(sortByDateDescending);

		console.log('fetched %d transactions', sortedTransactions.length);
		if (options.dedupe) {
			sortedTransactions = dedupeTransactions(sortedTransactions);
		}
		if (options.readable || options.formatted) {
			sortedTransactions = sortedTransactions.map(transaction => {
				if (options.readable) {
					stripSanitizedNumbers(transaction);
				}
				if (options.formatted) {
					formatDate(transaction);
					// TODO: format money
				}
				return transaction;
			});
		}

		return sortedTransactions;
	});
};

function sortByDateDescending(a, b) {
	return new Date(b.Date) - new Date(a.Date);
}

// sequences of digits > 4 are sanitized (eg xx1234) which is not very human-friendly
const sanitizedRegex = /x+[0-9.]+/gi;

function stripSanitizedNumbers(transaction) {
	const stripped = transaction.Company.replace(sanitizedRegex, '').replace(/\s{2,}/g, ' ');
	return Object.assign(transaction, { Company: stripped });
}

const humanDateFormat = 'MMM Do, YYYY';

function formatDate(transaction) {
	const formattedDate = transaction.Date.isValid() ? transaction.Date.format(humanDateFormat) : 'Unknown';
	return Object.assign(transaction, { Date: formattedDate });
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
