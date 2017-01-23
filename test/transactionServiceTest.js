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

			return transactionService.downloadAllTransactions().then(result => {
				assert.equal(result.transactions.length, 2);
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

			return transactionService.downloadAllTransactions().then(result => {
				assert.equal(result.transactions.length, 3);
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

			return transactionService.downloadAllTransactions().then(result => {
				assert.equal(result.transactions.length, 0);
			});
		});

		it('sorts by descending date', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Date: '2016-12-12', Amount: '123' },
						{ Date: '2017-01-22', Amount: '123' }
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Date: '2017-01-12', Amount: '123' }
					]
				});

			return transactionService.downloadAllTransactions().then(result => {
				const sortedDates = result.transactions.map(transaction => transaction.Date.format('YYYY-MM-DD'));
				assert.deepEqual(sortedDates, ['2017-01-22', '2017-01-12', '2016-12-12']);
			});
		});

		it('optionally formats dates', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					transactions: [
						{ Date: '2017-01-12', Amount: '123' },
						{ Date: undefined, Amount: '123' },
						{ Date: 'foo', Amount: '123' },
					]
				});

			return transactionService.downloadAllTransactions({ formatted: true }).then(result => {
				assert.equal(result.transactions.length, 3);
				const dates = result.transactions.map(transaction => transaction.Date);
				assert.deepEqual(dates, ['Jan 12th, 2017', 'Unknown', 'Unknown']);
			});
		});

		it('optionally formats amounts', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					transactions: [
						mockTransaction('123.4'),
						mockTransaction('-123.45'),
						mockTransaction('123456'),
					]
				});

			return transactionService.downloadAllTransactions({ formatted: true }).then(result => {
				assert.equal(result.transactions.length, 3);
				const amounts = result.transactions.map(transaction => transaction.Amount);
				assert.deepEqual(amounts, ['$123.40', '($123.45)', '$123,456']);
			});
		});

		it('optionally strips sanitized numbers for readability', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Company: 'XAVIER ACADEMY', Amount: '123' },
						{ Company: 'GROWINGCITY.COM xxxxxx4926 BC', Amount: '123' }
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						{ Company: 'NESTERS MARKET #x0064 VANCOUVER BC', Amount: '123' }
					]
				});

			return transactionService.downloadAllTransactions({ readable: true }).then(result => {
				assert.equal(result.transactions[0].Company, 'XAVIER ACADEMY');
				assert.equal(result.transactions[1].Company, 'GROWINGCITY.COM BC');
				assert.equal(result.transactions[2].Company, 'NESTERS MARKET # VANCOUVER BC');
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

			return transactionService.downloadAllTransactions({ dedupe: true }).then(result => {
				assert.equal(result.transactions.length, 2);
				assert.equal(result.transactions[0].Amount, '123');
				assert.equal(result.transactions[1].Amount, '456');
			});
		});

		describe('includes total balance', () => {
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

				return transactionService.downloadAllTransactions().then(result => {
					assert.equal(result.totalBalance, '150.00');
				});
			});

			it('respects formatted option', () => {
				nock(/.+/)
					.get('/transactions/1.json')
					.reply(200, {
						totalCount: 2,
						transactions: [
							mockTransaction('10000'),
							mockTransaction('500'),
						]
					});

				return transactionService.downloadAllTransactions({ formatted: true }).then(result => {
					assert.equal(result.totalBalance, '$10,500');
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

				return transactionService.downloadAllTransactions().then(result => {
					assert.equal(result.totalBalance, '150.50');
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

				return transactionService.downloadAllTransactions({ formatted: true }).then(result => {
					assert.equal(result.totalBalance, '($50)');
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

				return transactionService.downloadAllTransactions({ formatted: true }).then(result => {
					assert.equal(result.totalBalance, '$0.30');
				});
			});
		});
	});
});

