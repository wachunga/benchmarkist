'use strict';

const cache = module.exports = {};

let enabled = true;

// used for tests
cache.disable = function () {
	enabled = false;
};

// in reality, we would have a TTL etc
const memory = new Map();

cache.cached = function (key, missFn) {
	if (!enabled) {
		return missFn();
	}

	if (memory.has(key)) {
		return Promise.resolve(memory.get(key));
	}

	return missFn().then(result => {
		memory.set(key, result);
		return result;
	});
};
