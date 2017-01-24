'use strict';

const assert = require('assert');
const nock = require('nock');
const mockTransaction = require('./testHelper').mockTransaction;
const expenseService = require('../server/expenseService');

describe('expenseService', () => {
	describe('listExpenseCategories', () => {
		it('handles no transactions', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 0,
					transactions: []
				});

			return expenseService.listExpenseCategories().then(categories => {
				assert.equal(categories.length, 0);
			});
		});

		it('totals are a formatted string', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 1,
					transactions: [
						mockTransaction('-100', 'Web Hosting'),
					]
				});

			return expenseService.listExpenseCategories({ formatted: true }).then(categories => {
				assert.strictEqual(categories[0].total, '($100)');
			});
		});

		it('groups by category', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 4,
					transactions: [
						mockTransaction('-100', 'Web Hosting'),
						mockTransaction('-100', 'Travel'),
						mockTransaction('-100', 'Business Meals'),
						mockTransaction('-100', 'Web Hosting'),
					]
				});

			return expenseService.listExpenseCategories().then(categories => {
				assert.equal(categories.length, 3);

				const hosting = categories.find(category => category.categoryKey === 'Web Hosting');
				assert.equal(hosting.transactions.length, 2);
			});
		});

		it('excludes income (no category)', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						mockTransaction('-100', 'Web Hosting'),
						mockTransaction('5000', ''),
						mockTransaction('-100', 'Business Meals'),
					]
				});

			return expenseService.listExpenseCategories().then(categories => {
				const keys = categories.map(category => category.categoryKey).sort();
				assert.deepEqual(keys, ['Business Meals', 'Web Hosting']);
			});
		});

		it('sums by category', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 4,
					transactions: [
						mockTransaction('-100', 'Web Hosting'),
						mockTransaction('-100.25', 'Travel')
					]
				})
				.get('/transactions/2.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						mockTransaction('-200.50', 'Travel'),
						mockTransaction('-100', 'Web Hosting')
					]
				});

			return expenseService.listExpenseCategories({ formatted: true }).then(categories => {
				assert.equal(categories.length, 2);

				const hosting = categories.find(category => category.categoryKey === 'Web Hosting');
				assert.equal(hosting.total, '($200)');
				const travel = categories.find(category => category.categoryKey === 'Travel');
				assert.equal(travel.total, '($300.75)');
			});
		});

		it('sorts largest expense first', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						mockTransaction('-200.25', 'Travel'),
						mockTransaction('-100', 'Web Hosting'),
						mockTransaction('-200', 'Equipment')
					]
				});

			return expenseService.listExpenseCategories().then(categories => {
				const sortedCategoryKeys = categories.map(category => category.categoryKey);
				assert.deepEqual(sortedCategoryKeys, ['Travel', 'Equipment', 'Web Hosting']);
			});
		});

		it('includes percents', () => {
			nock(/.+/)
				.get('/transactions/1.json')
				.reply(200, {
					totalCount: 3,
					transactions: [
						mockTransaction('-250', 'Travel'),
						mockTransaction('-100', 'Web Hosting'),
						mockTransaction('-200', 'Equipment')
					]
				});

			return expenseService.listExpenseCategories({ formatted: true }).then(categories => {
				console.log(categories);
				const percents = categories.map(category => category.percent);
				assert.deepEqual(percents, ['45.5%', '36.4%', '18.2%']);
			});
		});
	});
});
