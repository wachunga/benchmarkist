'use strict';

const numeral = require('numeral');

const formatter = module.exports = {};

const asCurrencyWithThousandsSeparator = '($0,0[.]00)';
const asPercentage = '0[.]0%';
const asShortMonthDayYear = 'MMM Do, YYYY';

formatter.formatCurrency = function (amount) {
	return numeral(amount).format(asCurrencyWithThousandsSeparator);
};

formatter.formatPercentage = function (amount) {
	return numeral(amount).format(asPercentage);
};

formatter.formatTransaction = function (transaction) {
	formatDate(transaction);
	formatAmount(transaction);
	return transaction;
};

function formatDate(transaction) {
	transaction.Date = transaction.Date.isValid() ? transaction.Date.format(asShortMonthDayYear) : 'Unknown';
}

function formatAmount(transaction) {
	transaction.Amount = formatter.formatCurrency(transaction.Amount);
}
