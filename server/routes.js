'use strict';

const routes = require('express').Router();
const transactionService = require('./transaction/transactionService');
const expenseService = require('./expense/expenseService');

routes.get('/a/1/transactions', (req, res) => {
	transactionService.downloadAllTransactions(parseOptions(req))
		.then(result => res.json(result))
		.catch(makeErrorHandler(res));
});

routes.get('/a/1/expenses', (req, res) => {
	expenseService.listExpenseCategories(parseOptions(req))
		.then(result => res.json(result))
		.catch(makeErrorHandler(res));
});

function parseOptions(req) {
	return {
		formatted: req.query.formatted === 'true',
		dedupe: req.query.dedupe === 'true',
		benchmark: req.query.benchmark === 'true'
	};
}

function makeErrorHandler(res) {
	return err => {
		console.error(err.stack);
		res.sendStatus(500);
	};
}

module.exports = routes;
