# Backfire.js

## What?

Backfire is [yet another JavaScript data binding library] somewhat inspired by Apache Flex's binding mechanism. It was originally written to complement the React view framework, but could be used with anything.

It could be used on the client or on the server, but I'm not sure why you would want to do the latter.

## Installation

Via NPM:

```
npm install backfire
```

Via Bower:

```
bower install backfire.js
```

## API

### Bindable

```
var bf = require('backfire'); // or window.chemical

// Define a class with a schema
bf.Bindable.define('User', {
	forename: {
		writable: true
	},
	surname: {
		writable: true
	},
	name: {
		writable: false,
		depends: ['forename', 'surname'],
		get: function() {
			return this.forename + ' ' + this.surname;
		}
	}
});
```

## Tests

Run the tests (with Mocha):

```
npm test
```