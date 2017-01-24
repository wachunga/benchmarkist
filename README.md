# Benchmarkist

[![Build Status](https://travis-ci.org/wachunga/benchmarkist.svg?branch=master)](https://travis-ci.org/wachunga/benchmarkist)

## Running

As you would expect:
```bash
$ npm install
$ npm start
```

Tests can be run with:
```bash
$ npm test
```

## Design decisions

  * As specified, I avoided libraries on the client side but could not resist using a little ES6, especially for templating. I would normally use a templating library like Handlebars and keep the templates external from my code.
  * I chose not prioritize browser compatibility. For example, I used the [`<details>`](http://caniuse.com/#search=details) element which is not supported by IE.

## Future work

  * Responsiveness
  * Icons per expense type
  * Sortable tables
