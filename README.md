# koa-hazelcast

> Hazelcast storage for koa generic session middleware

## CAUTION

Work in progress! This package requires ReplicatedMap support that has not been implemented yet.
[check out](https://github.com/hazelcast/hazelcast-nodejs-client/pull/160)

## Installation

```bash
npm install koa-hazelcast --save
```

or 

```bash
yarn add koa-hazelcast
```

## Usage

```javascript
const Koa = require("koa");
const session = require("koa-generic-session");
const convert = require("koa-convert");
const HazelcastStore = require("koa-hazelcast");

const app = new Koa();

app.use(convert(session({
  store: new HazelcastStore({
      ttl: 86400000 // ttl must be set in milliseconds
  })
})));
```

## License

koa-hazelcast is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/red_rabbit)
