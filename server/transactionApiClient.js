'use strict';

const request = require('got');
const Promise = require('bluebird');
const moment = require('moment');

const transactionApiClient = module.exports = {};

const requestOptions = {
	json: true
};

const maxConcurrency = 10;

function getTransactionsUrl(page = 1) {
	// API docs available at http://resttest.bench.co
	return `http://resttest.bench.co/transactions/${page}.json`;
}

transactionApiClient.fetchTransactionsPage = function (page) {
	const pageUrl = getTransactionsUrl(page);
	return request(pageUrl, requestOptions);
};

transactionApiClient.fetchAllTransactions = function () {
	return transactionApiClient.fetchTransactionsPage(1).then(pageOneResponse => {
		const additionalPages = remainingPages(pageOneResponse);
		return Promise
			.map(additionalPages, page => request(getTransactionsUrl(page), requestOptions), { concurrency: maxConcurrency })
			.then(additionalResponses => {
				return [pageOneResponse, ...additionalResponses]
					.map(normalizeResponse)
					.reduce((combined, transactions) => {
						return combined.concat(transactions);
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

function normalizeResponse(response) {
	const transactions = response.body.transactions;
	return transactions.map(transaction => {
		if (!Number.isFinite(parseFloat(transaction.Amount))) {
			console.warn('Skipping transaction due to invalid amount', JSON.stringify(transaction));
			// treating it as 0 could be misleading, so skip it entirely
			return null;
		}

		return {
			Date: normalizeDate(transaction),
			Amount: transaction.Amount,
			Ledger: normalizeLedger(transaction),
			Company: transaction.Company
		};
	}).filter(Boolean); // drop invalid
}

function normalizeDate(transaction) {
	return transaction.Date ? moment.utc(transaction.Date, 'YYYY-MM-DD') : moment.invalid();
}

function normalizeLedger(transaction) {
	if (!transaction.Ledger) {
		return parseFloat(transaction.Amount) > 0 ? 'Income' : 'Unknown';
	}
	return transaction.Ledger.replace(/ Expense$/i, '');
}
