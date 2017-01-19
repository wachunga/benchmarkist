const transactionService = require('./lib/transactionService');

transactionService.downloadAllTransactions().then(transactions => {
	console.log(transactions);
});

module.exports = transactionService;
