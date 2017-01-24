'use strict';

const assert = require('assert');
const nock = require('nock');
const mockTransaction = require('./testHelper').mockTransaction;
const transactionClient = require('../server/transaction/transactionApiClient');

describe('transactionApiClient', () => {
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

		it('strips non-readable company names', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 5,
					transactions: [
						{ Company: 'XAVIER ACADEMY', Amount: '123' },
						{ Company: 'GROWINGCITY.COM xxxxxx4926 BC', Amount: '123' },
						{ Company: 'DROPBOX xxxxxx8396 CA 9.99 USD @ xx1001', Amount: '123' }
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					transactions: [
						{ Company: 'NESTERS MARKET #x0064 VANCOUVER BC', Amount: '123' },
						{ Company: 'ECHOSIGN xxxxxxxx6744 CA xx8.80 USD @ xx0878', Amount: '123' },
					]
				});

			return transactionClient.fetchAllTransactions().then(transactions => {
				const companies = transactions.map(transaction => transaction.Company);
				assert.deepEqual(companies, [
					'XAVIER ACADEMY',
					'GROWINGCITY.COM BC',
					'DROPBOX',
					'NESTERS MARKET VANCOUVER BC',
					'ECHOSIGN'
				]);
			});
		});
	});
});

