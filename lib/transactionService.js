'use strict';

const request = require('got');

const transactionService = module.exports = {};

const requestOptions = {
	json: true
};

function getTransactionsUrl(page = 1) {
	// API docs available at http://resttest.bench.co
	return `http://resttest.bench.co/transactions/${page}.json`;
}

transactionService.downloadAllTransactions = function () {
	let allTransactions = [];
	function addTransactions(response) {
		allTransactions = allTransactions.concat(response.body.transactions);
	}

	const pageOne = getTransactionsUrl(1);
	return request(pageOne, requestOptions).then(pageOneResponse => {
		addTransactions(pageOneResponse);

		const additionalPages = remainingPages(pageOneResponse);
		const transactionPromises = additionalPages.map(page => request(getTransactionsUrl(page), requestOptions));
		return Promise.all(transactionPromises).then(responses => {
			responses.forEach(response => addTransactions(response));
			console.log('fetched %d transactions', allTransactions.length);
			return allTransactions;
		});
	});
};

transactionService.calculateTotalBalance = function () {
	return transactionService.downloadAllTransactions().then(transactions => {
		return transactions
			.map(transaction => transaction.Amount)
			.reduce((a, b) => {
				return parseFloat(a) + parseFloat(b);
			}, 0);
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
