// Grab state Resource classes
const HelloWorld = require('./Hello-world')
const Hello = require('./Hello')
const World = require('./World')
const Add = require('./Add')
const Subtract = require('./Subtract')
const Failure = require('./Failure')
const A = require('./A')
const B = require('./B')
const C = require('./C')
const D = require('./D')
const E = require('./E')
const F = require('./F')
const G = require('./G')

// And export instances
module.exports = {
  helloWorld: new HelloWorld(),
  hello: new Hello(),
  world: new World(),
  add: new Add(),
  subtract: new Subtract(),
  failure: new Failure(),
  a: new A(),
  b: new B(),
  c: new C(),
  d: new D(),
  e: new E(),
  f: new F(),
  g: new G()
}
