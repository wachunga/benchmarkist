'use strict';

const assert = require('assert');
const nock = require('nock');
const transactionService = require('../lib/transactionService');

describe('transactionService', () => {
	function mockTransaction(amount) {
		return {
			Date: '2017-01-01',
			Ledger: 'Business Meals & Entertainment Expense',
			Amount: amount || '-123.45',
			Company: 'WHOLE FOODS'
		};
	}
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

