'use strict';

const assert = require('assert');
const nock = require('nock');
const mockTransaction = require('./testHelper').mockTransaction;
const transactionClient = require('../server/transactionApiClient');

describe('transactionClient', () => {
	function mockTransactions(count) {
		return new Array(count).fill(mockTransaction());
	}

	describe('fetchAllTransactions', () => {
		it('fetches single page of transactions', () => {
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

		it('combines multiple pages of transactions', () => {
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

		it('gracefully handles missing total count', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					transactions: mockTransactions(3)
				});

			return transactionClient.fetchAllTransactions().then(transactions => {
				// does not proceed to page 2
				assert.equal(transactions.length, 3);
			});
		});

		it('skips transactions with invalid amount', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					transactions: [
						mockTransaction(null),
						mockTransaction('foo'),
						mockTransaction('Infinity'),
						mockTransaction('123'),
					]
				});

			return transactionClient.fetchAllTransactions().then(transactions => {
				assert.equal(transactions.length, 1);
				assert.equal(transactions[0].Amount, '123');
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

		it('assigns Ledger as income when appropriate', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 2,
					transactions: [
						mockTransaction('500', ''),
						mockTransaction('-500', ''),
					]
				});

			return transactionClient.fetchAllTransactions().then(transactions => {
				assert.equal(transactions[0].Ledger, 'Income');
				assert.notEqual(transactions[1].Ledger, 'Income');
			});
		});
	});
});

