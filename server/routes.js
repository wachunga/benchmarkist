'use strict';

const routes = require('express').Router();
const transactionService = require('./transactionService');
const expenseService = require('./expenseService');

// TODO: split this up

routes.get('/a/1/transactions', (req, res) => {
	transactionService.downloadAllTransactions(parseOptions(req))
		.then(result => {
			res.status(200).json(result);
		}).catch(err => {
			console.error(err.stack);
			res.send(500);
		});
});

routes.get('/a/1/expenses', (req, res) => {
	expenseService.listExpenseCategories(parseOptions(req))
		.then(result => {
			res.status(200).json(result);
		}).catch(err => {
			console.error(err.stack);
			res.send(500);
		});
});

function parseOptions(req) {
	return {
		formatted: req.query.formatted === 'true',
		dedupe: req.query.dedupe === 'true',
		benchmark: req.query.benchmark === 'true'
	};
}

module.exports = routes;
