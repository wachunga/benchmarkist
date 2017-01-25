# Benchmarkist

[![Build Status](https://travis-ci.org/wachunga/benchmarkist.svg?branch=master)](https://travis-ci.org/wachunga/benchmarkist)

Try it out at [benchmarkist.now.sh](https://benchmarkist.now.sh)

## Features
Built according to [provided](http://resttest.bench.co) [specs](http://resttest.bench.co/front-end):

  * Transaction list with total balance
  * Easily readable vendor names
  * De-duplicated transactions
  * Expense category breakdown with benchmarking vs other small businesses

## Install

As you would expect:
```bash
$ npm install
$ npm start
```
(Requires Node.js >= 6.)

Tests and linting:
```bash
$ npm test
```

## Design decisions

  * Promise-based APIs because they're just so convenient.
  * Because we're dealing with money, I made sure to avoid floating point math issues.
  * As specified, I didn't use any libraries on the client side but could not resist using a little ES6 (mostly for templating). I would normally use a templating library like Handlebars and keep the templates external from my code.
  * I chose not prioritize browser compatibility and focused on Chrome and Firefox. For example, I used the [`<details>`](http://caniuse.com/#search=details) element which is not supported by IE.

## Future improvements

  * Icons per expense type
  * Sortable table columns
  * Charts (eg expense donut chart)
  * Responsiveness
