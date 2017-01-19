'use strict';

const assert = require('assert');
const nock = require('nock');
const transactionService = require('../lib/transactionService');

describe('transactionService', () => {
	function mockTransaction() {
		return {
			Date: '2017-01-01',
			Ledger: 'Business Meals & Entertainment Expense',
			Amount: '-123.45',
			Company: 'WHOLE FOODS'
		};
	}
	function mockTransactions(count) {
		return new Array(count).fill(mockTransaction());
	}

	it('downloads single page of transactions', () => {
		nock(/.+/)
			.get('/transactions/1.json')
			.reply(200, {
				totalCount: 2,
				transactions: mockTransactions(2)
			});

		return transactionService.downloadAllTransactions().then(transactions => {
			assert.equal(transactions.length, 2);
		});
	});

	it('downloads multiple pages of transactions', () => {
		nock(/.+/)
			.get('/transactions/1.json')
			.reply(200, {
				totalCount: 3,
				transactions: mockTransactions(2)
			})
			.get('/transactions/2.json')
			.reply(200, {
				totalCount: 3,
				transactions: mockTransactions(1)
			});

		return transactionService.downloadAllTransactions().then(transactions => {
			assert.equal(transactions.length, 3);
		});
	});

	it('includes status code in propagated error', () => {
		nock(/.+/)
			.get('/transactions/1.json')
			.reply(500);

		return transactionService.downloadAllTransactions().then(() => {
			assert.fail(null, null, 'should not be a success');
		}).catch(err => {
			assert.equal(err.statusCode, 500);
		});
	});

	it('handles no transactions', () => {
		nock(/.+/)
			.get('/transactions/1.json')
			.reply(200, {
				totalCount: 0,
				transactions: []
			});

		return transactionService.downloadAllTransactions().then(transactions => {
			assert.equal(transactions.length, 0);
		});
	});
});

