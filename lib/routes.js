'use strict';

const routes = require('express').Router();
const transactionService = require('./transactionService');
const expenseService = require('./expenseService');

// TODO: split this up

routes.get('/a/1/transactions', (req, res) => {
	const options = req.query;
	transactionService.downloadAllTransactions(options)
		.then(result => {
			res.status(200).json(result);
		}).catch(err => {
			console.error(err.stack);
			res.send(500);
		});
});

routes.get('/a/1/expenses', (req, res) => {
	const options = req.query;
	expenseService.listExpenseCategories(options)
		.then(result => {
			res.status(200).json(result);
		}).catch(err => {
			console.error(err.stack);
			res.send(500);
		});
});

module.exports = routes;
