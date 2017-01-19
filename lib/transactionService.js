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

	const startUrl = getTransactionsUrl(1);
	return request(startUrl, requestOptions).then(response => {
		addTransactions(response);

		const additionalPages = remainingPages(response);
		const transactionPromises = additionalPages.map(page => request(getTransactionsUrl(page), requestOptions));
		return Promise.all(transactionPromises).then(responses => {
			responses.forEach(response => addTransactions(response));
			console.log('fetched %d transactions', allTransactions.length);
			return allTransactions;
		});
	}).catch(error => {
		console.log(error);
	});
};

function remainingPages(response) {
	const lastPage = Math.ceil(response.body.totalCount / response.body.transactions.length);
	return range(2, lastPage);
}

function range(start = 1, end) {
	const ranged = [];
	for (let i = start; i <= end; i++) {
		ranged.push(i);
	}
	return ranged;
}
