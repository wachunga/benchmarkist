'use strict';

const request = require('got');
const Promise = require('bluebird');

const transactionApiClient = module.exports = {};

const requestOptions = {
	json: true
};

function getTransactionsUrl(page = 1) {
	// API docs available at http://resttest.bench.co
	return `http://resttest.bench.co/transactions/${page}.json`;
}

transactionApiClient.fetchTransactions = function (page) {
	const pageUrl = getTransactionsUrl(page);
	return request(pageUrl, requestOptions);
};

transactionApiClient.fetchAllTransactions = function () {
	return transactionApiClient.fetchTransactions(1).then(pageOneResponse => {
		const additionalPages = remainingPages(pageOneResponse);
		return Promise
			.map(additionalPages, page => request(getTransactionsUrl(page), requestOptions), { concurrency: 10 })
			.then(additionalResponses => {
				return [pageOneResponse, ...additionalResponses].reduce((combined, response) => {
					return combined.concat(response.body.transactions);
				}, []);
			});
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
