'use strict';

const expenseTypes = require('../expense/expenseTypes');

const benchmarkService = module.exports = {};

// this proof-of-concept uses national average small business expenses from
// http://blog.shoeboxed.com/small-business-expenses-how-do-yours-compare-to-the-national-average/
// but the US Census Bureau would be even better: http://www.census.gov/econ/bes/index.html

const expenseBenchmarks = {};
expenseBenchmarks.default = {
	[expenseTypes.all.auto.label]: 0.11,
	[expenseTypes.all.education.label]: 0.1,
	[expenseTypes.all.equipment.label]: 0.19,
	[expenseTypes.all.insurance.label]: 0.02,
	[expenseTypes.all.mealsAndEntertainment.label]: 0.12,
	[expenseTypes.all.office.label]: 0.03,
	[expenseTypes.all.phone.label]: 0.03,
	[expenseTypes.all.postage.label]: 0.01,
	[expenseTypes.all.travel.label]: 0.03,
	[expenseTypes.all.web.label]: 0.03,
	[expenseTypes.all.other.label]: 0.34,
};

benchmarkService.getExpenseBenchmark = function (category, businessType) {
	if (!category || !expenseTypes.findByLabel(category)) {
		throw new Error(`unsupported expense category: ${category}`);
	}
	const benchmarks = expenseBenchmarks[businessType] || expenseBenchmarks.default;
	return benchmarks[category];
};
