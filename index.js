'use strict';

const transactionService = require('./lib/transactionService');

transactionService.downloadAllTransactions().then(transactions => {
	console.log(transactions);
}).catch(err => {
	console.log(err);
});

module.exports = transactionService;
