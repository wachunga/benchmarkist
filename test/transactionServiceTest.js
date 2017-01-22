'use strict';

const assert = require('assert');
const nock = require('nock');
const mockTransaction = require('./testHelper').mockTransaction;
const transactionService = require('../lib/transactionService');

describe('transactionService', () => {
	function mockTransactions(count) {
		return new Array(count).fill(mockTransaction());
	}

	describe('downloadAllTransactions', () => {
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

		it('sorts by descending date', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Date: '2016-12-12' },
						{ Date: '2017-01-22' }
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Date: '2017-01-12' }
					]
				});

			return transactionService.downloadAllTransactions().then(transactions => {
				const sortedDates = transactions.map(transaction => transaction.Date);
				assert.deepEqual(sortedDates, ['2017-01-22', '2017-01-12', '2016-12-12']);
			});
		});

		it('optionally strips sanitized numbers for readability', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Company: 'XAVIER ACADEMY' },
						{ Company: 'GROWINGCITY.COM xxxxxx4926 BC' }
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Company: 'NESTERS MARKET #x0064 VANCOUVER BC' }
					]
				});

			return transactionService.downloadAllTransactions({ readable: true }).then(transactions => {
				assert.equal(transactions[0].Company, 'XAVIER ACADEMY');
				assert.equal(transactions[1].Company, 'GROWINGCITY.COM BC');
				assert.equal(transactions[2].Company, 'NESTERS MARKET # VANCOUVER BC');
			});
		});

		it('optionally removes duplicates', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						mockTransaction(123),
						mockTransaction(456)
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						mockTransaction(123)
					]
				});

			return transactionService.downloadAllTransactions({ dedupe: true }).then(transactions => {
				assert.equal(transactions.length, 2);
				assert.equal(transactions[0].Amount, '123');
				assert.equal(transactions[1].Amount, '456');
			});
		});
	});

	describe('calculateTotalBalance', () => {
		it('sums round dollars', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 2,
					transactions: [
						mockTransaction('100'),
						mockTransaction('50'),
					]
				});

			return transactionService.calculateTotalBalance().then(balance => {
				assert.equal(balance, '150.00');
			});
		});

		it('sums dollars and cents', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 2,
					transactions: [
						mockTransaction('100.10'),
						mockTransaction('50.40'),
					]
				});

			return transactionService.calculateTotalBalance().then(balance => {
				assert.equal(balance, '150.50');
			});
		});

		it('sums negative amounts', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 2,
					transactions: [
						mockTransaction('-100.50'),
						mockTransaction('50.50'),
					]
				});

			return transactionService.calculateTotalBalance().then(balance => {
				assert.equal(balance, '-50.00');
			});
		});

		it('sums multiple pages', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 4,
					transactions: [
						mockTransaction('100.10'),
						mockTransaction('50.40'),
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 4,
					transactions: [
						mockTransaction('-20.20'),
						mockTransaction('-30.30'),
					]
				});

			return transactionService.calculateTotalBalance().then(balance => {
				assert.equal(balance, '100.00');
			});
		});

		it('handles common floating point issues', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 2,
					transactions: [
						mockTransaction('0.10'),
						mockTransaction('0.20'),
					]
				});

			return transactionService.calculateTotalBalance().then(balance => {
				assert.equal(balance, '0.30');
			});
		});
	});
});

