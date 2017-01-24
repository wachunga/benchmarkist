'use strict';

const numeral = require('numeral');

const formatter = module.exports = {};

const asCurrencyWithThousandsSeparator = '($0,0[.]00)';

formatter.formatCurrency = function (amount) {
	return numeral(amount).format(asCurrencyWithThousandsSeparator);
};

formatter.formatTransaction = function (transaction) {
	stripSanitizedNumbers(transaction);
	formatDate(transaction);
	formatAmount(transaction);
	return transaction;
};

// sequences of digits > 4 are sanitized (eg xx1234) which is not very human-friendly
const sanitizedRegex = /x+[0-9.]+/gi;

function stripSanitizedNumbers(transaction) {
	if (!transaction.Company) {
		return;
	}

	const stripped = transaction.Company.replace(sanitizedRegex, '').replace(/\s{2,}/g, ' ');
	transaction.Company = stripped;
}

const asShortMonthDayYear = 'MMM Do, YYYY';

function formatDate(transaction) {
	transaction.Date = transaction.Date.isValid() ? transaction.Date.format(asShortMonthDayYear) : 'Unknown';
}

function formatAmount(transaction) {
	transaction.Amount = formatter.formatCurrency(transaction.Amount);
}
