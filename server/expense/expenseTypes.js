'use strict';

class ExpenseType {
	constructor(key, label) {
		this.key = key;
		this.label = label;
	}
}

const expenseTypes = {
	auto: new ExpenseType('auto', 'Auto'),
	education: new ExpenseType('education', 'Education'),
	equipment: new ExpenseType('equipment', 'Equipment'),
	insurance: new ExpenseType('insurance', 'Insurance'),
	mealsAndEntertainment: new ExpenseType('mealsAndEntertainment', 'Business Meals & Entertainment'),
	office: new ExpenseType('office', 'Office'),
	other: new ExpenseType('other', 'Other'),
	phone: new ExpenseType('phone', 'Phone & Internet'),
	postage: new ExpenseType('postage', 'Postage & Shipping'),
	travel: new ExpenseType('travel', 'Travel, Nonlocal'),
	web: new ExpenseType('web', 'Web Hosting & Services'),
};

module.exports = {
	all: expenseTypes,
	findByLabel(label) {
		const values = Object.keys(expenseTypes).map(type => expenseTypes[type]);
		return values.find(value => value.label === label);
	}
};
