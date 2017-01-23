'use strict';

exports.mockTransaction = function (amount = '-123.45', ledger = 'Business Meals', company = 'WHOLE FOODS', date = '2017-01-01') {
	return {
		Amount: amount,
		Ledger: ledger,
		Company: company,
		Date: date
	};
};
