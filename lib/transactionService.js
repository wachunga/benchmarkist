'use strict';

const request = require('got');
const Big = require('big.js');

const transactionService = module.exports = {};

const requestOptions = {
	json: true
};

function getTransactionsUrl(page = 1) {
	// API docs available at http://resttest.bench.co
	return `http://resttest.bench.co/transactions/${page}.json`;
}

transactionService.downloadAllTransactions = function (options = {}) {
	let allTransactions = [];
	function addTransactions(response) {
		let transactions = response.body.transactions;
		if (options.readable) {
			transactions = transactions.map(stripSanitizedNumbers);
		}
		allTransactions = allTransactions.concat(transactions);
	}

	const pageOne = getTransactionsUrl(1);
	return request(pageOne, requestOptions).then(pageOneResponse => {
		addTransactions(pageOneResponse);

		const additionalPages = remainingPages(pageOneResponse);
		const transactionPromises = additionalPages.map(page => request(getTransactionsUrl(page), requestOptions)); // TODO: throttle
		return Promise.all(transactionPromises).then(responses => {
			responses.forEach(response => addTransactions(response));
			console.log('fetched %d transactions', allTransactions.length);
			if (options.dedupe) {
				allTransactions = dedupeTransactions(allTransactions);
			}
			return allTransactions;
		});
	});
};

// sequences of digits > 4 are sanitized (eg xx1234) which is not very human-friendly
const sanitizedRegex = /x+[0-9.]+/gi;

function stripSanitizedNumbers(transaction) {
	const stripped = transaction.Company.replace(sanitizedRegex, '').replace(/\s{2,}/g, ' ');
	return Object.assign(transaction, { Company: stripped });
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

transactionService.calculateTotalBalance = function () {
	return transactionService.downloadAllTransactions().then(transactions => {
		return transactions
			.map(transaction => transaction.Amount)
			.reduce((a, b) => {
				return a.plus(b);
			}, new Big(0))
			.toFixed(2);
	});
};

function remainingPages(response) {
	const finalPage = Math.ceil(response.body.totalCount / response.body.transactions.length);
	return range(2, finalPage);
}

function range(start = 1, end) {
	const ranged = [];
	for (let i = start; i <= end; i += 1) {
		ranged.push(i);
	}
	return ranged;
}
