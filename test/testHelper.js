'use strict';

exports.mockTransaction = function (amount = '-123.45', ledger = 'Business Meals') {
	return {
		Date: '2017-01-01',
		Ledger: ledger,
		Amount: amount,
		Company: 'WHOLE FOODS'
	};
};
