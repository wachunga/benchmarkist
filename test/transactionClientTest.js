'use strict';

const assert = require('assert');
const nock = require('nock');
const mockTransaction = require('./testHelper').mockTransaction;
const transactionClient = require('../lib/transactionApiClient');

describe('transactionClient', () => {
	function mockTransactions(count) {
		return new Array(count).fill(mockTransaction());
	}

	describe('fetchAllTransactions', () => {
		it('downloads single page of transactions', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 2,
					transactions: mockTransactions(2)
				});

			return transactionClient.fetchAllTransactions().then(transactions => {
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

			return transactionClient.fetchAllTransactions().then(transactions => {
				assert.equal(transactions.length, 3);
			});
		});

		it('includes status code in propagated error', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(500);

			return transactionClient.fetchAllTransactions().then(() => {
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

			return transactionClient.fetchAllTransactions().then(transactions => {
				assert.equal(transactions.length, 0);
			});
		});
	});
});

