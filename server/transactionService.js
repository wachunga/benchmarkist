'use strict';

const Big = require('big.js');
const numeral = require('numeral');
const transactionApiClient = require('./transactionApiClient');

const transactionService = module.exports = {};

transactionService.downloadAllTransactions = function (options = {}) {
	return transactionApiClient.fetchAllTransactions().then(transactions => {
		let sortedTransactions = transactions.sort(sortByDateDescending);

		console.log('fetched %d transactions', sortedTransactions.length);
		if (options.dedupe) {
			sortedTransactions = dedupeTransactions(sortedTransactions);
			console.log('after dedupe: %d transactions', sortedTransactions.length);
		}

		let totalBalance = calculateTotalBalance(sortedTransactions);
		if (options.formatted) {
			totalBalance = formatCurrency(totalBalance);
		}

		if (options.readable || options.formatted) {
			sortedTransactions = sortedTransactions.map(transaction => {
				if (options.readable) {
					stripSanitizedNumbers(transaction);
				}
				if (options.formatted) {
					formatDate(transaction);
					formatAmount(transaction);
				}
				return transaction;
			});
		}

		return {
			totalBalance,
			transactions: sortedTransactions
		};
	});
};

function sortByDateDescending(a, b) {
	return new Date(b.Date) - new Date(a.Date);
}

// sequences of digits > 4 are sanitized (eg xx1234) which is not very human-friendly
const sanitizedRegex = /x+[0-9.]+/gi;

function stripSanitizedNumbers(transaction) {
	const stripped = transaction.Company.replace(sanitizedRegex, '').replace(/\s{2,}/g, ' ');
	transaction.Company = stripped;
}

const asShortMonthDayYear = 'MMM Do, YYYY';

function formatDate(transaction) {
	const formattedDate = transaction.Date.isValid() ? transaction.Date.format(asShortMonthDayYear) : 'Unknown';
	transaction.Date = formattedDate;
}

function formatAmount(transaction) {
	transaction.Amount = formatCurrency(transaction.Amount);
}

const asCurrencyWithThousandsSeparator = '($0,0[.]00)';

function formatCurrency(amount) {
	return numeral(amount).format(asCurrencyWithThousandsSeparator);
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
